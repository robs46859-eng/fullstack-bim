import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.post('/', async (req, res) => {
  const { task_run_id, decision, notes } = req.body;
  if (!task_run_id || !decision) return res.status(400).json({ error: 'task_run_id and decision required' });
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ error: 'decision must be approved or rejected' });
  try {
    const result = await query(
      'INSERT INTO approvals (task_run_id, decision, notes) VALUES ($1,$2,$3) RETURNING *',
      [task_run_id, decision, notes || null]
    );
    // Update run status
    await query(`UPDATE task_runs SET status=$1 WHERE id=$2`, [decision, task_run_id]);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.message === 'Database not configured') return res.status(503).json({ error: 'Database not configured' });
    res.status(500).json({ error: err.message });
  }
});

export default router;
