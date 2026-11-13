import { apiUrl } from "@/lib/apiBase";
import { auth } from "@/lib/firebase";

export const isImageRequest = (text = "") =>
  /\b(generate|create|draw|make)\b.{0,35}\b(image|picture|photo|art|logo)\b/i.test(text);

export default async function requestReply({
  text, userContent, pendingFile, photoMode, messages, language, thinkHarder, specialMode, signal
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");

  const token = await user.getIdToken();
  const form = new FormData();
  form.append("text", text || userContent || "");
  form.append("language", language || "en");
  form.append("thinkHarder", String(!!thinkHarder));
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
  return {
    content: data.reply || (data.specialData ? "Analysis complete." : "") || data.content || "No response was returned.",
    image_url: "",
    ...(data.specialData ? { specialData: { ...data.specialData, type: specialMode === "truthRadar" ? "truthRadar" : "bargain" } } : {})
  };
}
