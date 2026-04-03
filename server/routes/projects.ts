import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    if (err.message === 'Database not configured') return res.status(503).json({ error: 'Database not configured' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, repo_url } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = await query(
      'INSERT INTO projects (name, repo_url) VALUES ($1, $2) RETURNING *',
      [name, repo_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.message === 'Database not configured') return res.status(503).json({ error: 'Database not configured' });
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
