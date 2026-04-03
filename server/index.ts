import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import runsRouter from './routes/runs.js';
import approvalsRouter from './routes/approvals.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/runs', runsRouter);
app.use('/api/approvals', approvalsRouter);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'StelarBIM' }));

// Serve Vite frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`StelarBIM server running on port ${PORT}`);
});
