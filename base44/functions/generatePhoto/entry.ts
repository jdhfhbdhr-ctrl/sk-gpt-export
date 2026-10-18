import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const prompt = (body.prompt || '').toString().trim();
    if (!prompt) return Response.json({ error: 'A prompt is required' }, { status: 400 });
    if (prompt.length > 1200) return Response.json({ error: 'Prompt is too long' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
    return Response.json({ url: result.url, prompt });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}