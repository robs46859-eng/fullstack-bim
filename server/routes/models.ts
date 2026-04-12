import { Router } from 'express';
import type { Request, Response } from 'express';
import { Storage } from '@google-cloud/storage';

const router = Router();

const BUCKET = process.env.GCS_BUCKET ?? '';

let _storage: Storage | null = null;
function getStorage(): Storage {
  if (!_storage) {
    if (!process.env.GCS_PROJECT_ID) throw new Error('GCS_PROJECT_ID is not configured');
    _storage = new Storage({ projectId: process.env.GCS_PROJECT_ID });
  }
  return _storage;
}

// POST /api/models/upload-url
// Returns a signed URL the browser can use to PUT a model file directly to GCS
router.post('/upload-url', async (req: Request, res: Response) => {
  const { filename, contentType } = req.body as { filename?: string; contentType?: string };

  if (!filename || !contentType) {
    return res.status(400).json({ error: { code: 'missing_params', message: 'filename and contentType are required' } });
  }
  if (!BUCKET) {
    return res.status(503).json({ error: { code: 'storage_not_configured', message: 'GCS_BUCKET is not configured' } });
  }

  const allowed = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
  if (!allowed.includes(contentType)) {
    return res.status(400).json({ error: { code: 'invalid_type', message: 'Only GLTF/GLB files are supported' } });
  }

  try {
    const key = `models/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const [signedUrl] = await getStorage()
      .bucket(BUCKET)
      .file(key)
      .generateSignedPostPolicyV4({
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        conditions: [['content-length-range', 0, 500 * 1024 * 1024]], // 500 MB max
        fields: { 'Content-Type': contentType },
      });

    const publicUrl = `https://storage.googleapis.com/${BUCKET}/${key}`;
    res.json({ uploadUrl: signedUrl.url, fields: signedUrl.fields, publicUrl, key });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'storage_error', message: err.message } });
  }
});

// GET /api/models — list models in bucket (optional, for model library)
router.get('/', async (_req: Request, res: Response) => {
  if (!BUCKET) {
    return res.json({ models: [] });
  }
  try {
    const [files] = await getStorage().bucket(BUCKET).getFiles({ prefix: 'models/' });
    const models = files.map(f => ({
      name: f.name.replace('models/', ''),
      url: `https://storage.googleapis.com/${BUCKET}/${f.name}`,
      updated: f.metadata.updated,
      size: Number(f.metadata.size ?? 0),
    }));
    res.json({ models });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'storage_error', message: err.message } });
  }
});

export default router;
