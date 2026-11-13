
import { apiUrl } from "@/lib/apiBase";
import { auth } from "@/lib/firebase";

export const isImageRequest = (text = "") =>
  /\b(generate|create|draw|make)\b.{0,35}\b(image|picture|photo|art|logo)\b/i.test(text);

const getPreference = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
};

const applySpeech = (content) => {
  if (!getPreference("sk-gpt-auto-read", false)) return;
  if (!("speechSynthesis" in window) || !content) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(content);
  const voiceType = getPreference("sk-gpt-voice", "female");
  const speed = Number(getPreference("sk-gpt-speech-speed", 1)) || 1;
  const language = getPreference("sk-gpt-language", "en");

  const langMap = {
    en: "en-US", ur: "ur-PK", "roman-ur": "ur-PK",
    ar: "ar-SA", hi: "hi-IN", es: "es-ES",
    fr: "fr-FR", de: "de-DE"
  };

  utterance.lang = langMap[language] || language || "en-US";
  utterance.rate = Math.min(1.5, Math.max(0.8, speed));

  const voices = window.speechSynthesis.getVoices();
  const matching = voices.filter(v => v.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase()));
  const preferred = matching.find(v =>
    voiceType === "male"
      ? /male|david|daniel|alex/i.test(v.name)
      : /female|zira|samantha|karen/i.test(v.name)
  );

  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
};

export default async function requestReply({
  text, userContent, pendingFile, photoMode, messages, language,
  thinkHarder, specialMode, councilMode, signal
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");

  const token = await user.getIdToken();
  const form = new FormData();

  let requestText = text || userContent || "";
  const style = getPreference("sk-gpt-response-style", "friendly");
  const truthMeter = getPreference("sk-gpt-truth-meter", false);

  const styleInstructions = {
    friendly: "Respond in a friendly, helpful and clear manner.",
    professional: "Respond professionally and formally.",
    short: "Keep the answer short, direct and useful.",
    desi: "Use a natural, warm Desi conversational tone."
  };

  const preferences = [
    styleInstructions[style] || styleInstructions.friendly,
    truthMeter
      ? "Include a brief Truth Meter section when relevant: distinguish verified facts, uncertain claims and missing evidence. Never invent sources or claim certainty without evidence."
      : ""
  ].filter(Boolean).join(" ");

  if (preferences && requestText) {
    requestText = `[SK GPT response preferences: ${preferences}]\n\n${requestText}`;
  }

  form.append("text", requestText);
  form.append("language", language || "en");
  form.append("thinkHarder", String(!!thinkHarder));
  form.append("councilMode", String(!!councilMode));
  form.append("photoMode", String(!!photoMode));

  if (specialMode) form.append("specialMode", specialMode);
  form.append("messages", JSON.stringify(messages || []));
  if (pendingFile?.file) form.append("file", pendingFile.file);

  const endpointPath = specialMode ? "/api/chat" : photoMode || isImageRequest(text)
    ? "/api/images/generate"
    : pendingFile?.type === "application/pdf"
      ? "/api/pdf/analyze"
      : "/api/chat";

  const response = await fetch(apiUrl(endpointPath), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);

  if (endpointPath === "/api/images/generate") {
    if (!data.image_url) throw new Error("Image generation returned no image.");
    return { content: data.content || "Your image is ready.", image_url: data.image_url };
  }

  const content = data.reply ||
    (data.specialData ? "Analysis complete." : "") ||
    data.content || "No response was returned.";

  applySpeech(content);

  return {
    content,
    image_url: "",
    ...(data.specialData ? {
      specialData: {
        ...data.specialData,
        type: specialMode === "truthRadar" ? "truthRadar" : "bargain"
      }
    } : {}),
    ...(data.councilData ? { councilData: data.councilData } : {})
  };
}
