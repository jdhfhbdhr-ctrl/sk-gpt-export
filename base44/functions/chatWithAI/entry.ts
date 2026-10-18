import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', ru: 'Russian', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', pl: 'Polish', sv: 'Swedish',
  id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', he: 'Hebrew', fa: 'Persian',
  ur: 'Urdu',
  'roman-ur': 'Roman Urdu (Urdu written in Latin/Roman script, e.g. "aap kaise hain")',
  bn: 'Bengali'
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const language = body.language || 'en';
    const fileUrls = Array.isArray(body.fileUrls) ? body.fileUrls : [];
    const thinkHarder = !!body.thinkHarder;

    if (messages.length === 0) {
      return Response.json({ error: 'No messages provided' }, { status: 400 });
    }

    if (messages.some((message) => !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string')) return Response.json({ error: 'Invalid conversation messages' }, { status: 400 });
    if (JSON.stringify(messages).length > 300000 || fileUrls.length > 5) return Response.json({ error: 'This conversation exceeds the request size limit. Start a new chat or reduce attached context.' }, { status: 413 });

    const langName = LANG_NAMES[language] || 'English';
    let systemPrompt = `You are SK GPT, a helpful and accurate AI assistant. Respond naturally in ${langName}. Follow the user's requested length and level of detail. Give direct concise answers to simple questions, and detailed, structured explanations for complex questions, tutorials, coding tasks, comparisons, and comprehensive requests. Use Markdown headings, paragraphs, lists, examples, fenced code blocks, and pipe tables where useful. Do not force short or generic answers, truncate examples, or omit requested sections. Use the supplied conversation context for follow-ups. Do not invent missing context. Do NOT introduce yourself or repeat a greeting unless the user is greeting you. If the user attached an image, analyze it. For PDFs and files, use provided content. Never claim to have generated an image: image creation is handled by a separate tool.`;
    if (thinkHarder) {
      systemPrompt += ' The user enabled "Think harder": carefully check your answer and give a thorough explanation of the solution with useful steps, without exposing private internal reasoning.';
    }

    const history = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${systemPrompt}\n\n${history}\n\nAssistant:`;

    const llmInput = { prompt };
    if (fileUrls.length) llmInput.file_urls = fileUrls;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM(llmInput);

    const reply = typeof result === 'string' ? result : (result?.response || result?.text || JSON.stringify(result));

    if (!reply?.trim()) return Response.json({ error: 'The AI provider returned an empty response. Please try again.' }, { status: 502 });
    return Response.json({ reply });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}