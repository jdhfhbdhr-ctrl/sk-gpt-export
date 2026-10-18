import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileUrl = (body.fileUrl || '').toString();
    if (!fileUrl) return Response.json({ error: 'fileUrl is required' }, { status: 400 });

    const jsonSchema = body.schema || {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The full extracted text content of the document' },
        summary: { type: 'string', description: 'A short summary of the document' }
      },
      required: ['content', 'summary']
    };

    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
      json_schema: jsonSchema
    });

    return Response.json({ data: result });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}