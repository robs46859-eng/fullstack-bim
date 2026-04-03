import { Router } from 'express';
import { query } from '../db.js';
import { runClaudePlanningLane } from '../claude.js';

const router = Router();

router.post('/', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not set' });
  }
  const { taskId, goal, projectContext } = req.body;
  if (!taskId || !goal) return res.status(400).json({ error: 'taskId and goal required' });
  try {
    await runClaudePlanningLane(taskId, goal, projectContext || '', res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { status } = req.query;
  try {
    const result = status
      ? await query('SELECT tr.*, t.title as task_title FROM task_runs tr JOIN tasks t ON tr.task_id=t.id WHERE tr.status=$1 ORDER BY tr.created_at DESC', [status])
      : await query('SELECT tr.*, t.title as task_title FROM task_runs tr JOIN tasks t ON tr.task_id=t.id ORDER BY tr.created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    if (err.message === 'Database not configured') return res.status(503).json({ error: 'Database not configured' });
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM task_runs WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
