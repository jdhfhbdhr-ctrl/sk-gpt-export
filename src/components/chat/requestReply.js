import { base44 } from '@/api/base44Client';

export const isImageRequest = (text) => /\b(generate|create|make|draw|paint|design)\s+(?:(?:me|us)\s+)?(?:(?:an?|the|some)\s+)?(?:(?:ai|realistic|photorealistic|beautiful|detailed)[ -]){0,3}(?:image|photo|picture|drawing|painting|illustration)\b/i.test(text) || /^(?:please\s+)?(?:draw|paint)\s+\S/i.test(text);
export default async function requestReply({ text, userContent, pendingFile, photoMode, messages, language, thinkHarder }) {
  if (photoMode || isImageRequest(text)) {
    const prompt = text || pendingFile?.name || 'a beautiful image';
    const response = await base44.functions.invoke('generatePhoto', { prompt });
    if (!response.data?.url || !/^https:\/\//.test(response.data.url)) throw new Error(response.data?.error || 'Image generation returned no usable image URL.');
    return { content: `Here's the image I created for: "${prompt}"`, image_url: response.data.url };
  }
  let content = userContent;
  const fileUrls = [];
  if (pendingFile?.uri) {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: pendingFile.uri });
    if (pendingFile.type === 'application/pdf') {
      const pdf = await base44.functions.invoke('processPdf', { fileUrl: signed_url });
      const output = pdf.data?.data?.output || {};
      if (!output.content && !output.summary) throw new Error(pdf.data?.error || 'Could not extract the PDF content.');
      content += `\n\nPDF "${pendingFile.name}":\n${output.summary || ''}\n${output.content || ''}`;
    } else fileUrls.push(signed_url);
  }
  const history = [...messages, { role: 'user', content }].map((message) => ({ role: message.role, content: message.content }));
  const response = await base44.functions.invoke('chatWithAI', { messages: history, language, fileUrls, thinkHarder });
  if (!response.data?.reply) throw new Error(response.data?.error || 'The AI returned no response.');
  return { content: response.data.reply, image_url: '' };
}