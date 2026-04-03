import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { projectId } = req.query;
  try {
    const result = projectId
      ? await query('SELECT * FROM tasks WHERE project_id=$1 ORDER BY created_at DESC', [projectId])
      : await query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    if (err.message === 'Database not configured') return res.status(503).json({ error: 'Database not configured' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { project_id, task_class, title, description, risk_level } = req.body;
  if (!project_id || !task_class || !title) return res.status(400).json({ error: 'project_id, task_class, title required' });
  try {
    const result = await query(
      'INSERT INTO tasks (project_id, task_class, title, description, risk_level) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [project_id, task_class, title, description || null, risk_level || 'low']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.message === 'Database not configured') return res.status(503).json({ error: 'Database not configured' });
    res.status(500).json({ error: err.message });
  }
});

export default router;
