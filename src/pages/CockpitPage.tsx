import React, { useEffect, useState, useRef } from 'react';

const API = import.meta.env.DEV ? 'http://localhost:3000' : '';

interface Project { id: string; name: string; status: string; repo_url?: string; }
interface Task { id: string; title: string; task_class: string; risk_level: string; status: string; description?: string; }
interface Run { id: string; task_title: string; output_summary: string; cost_usd: number; latency_ms: number; status: string; }

const TASK_CLASSES = ['architecture_plan', 'code_patch', 'code_review', 'debug_trace', 'ui_scaffold', 'deploy_mission'];
const RISK_LEVELS = ['low', 'medium', 'high'];

export default function CockpitPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [pendingRuns, setPendingRuns] = useState<Run[]>([]);
  const [streamOutput, setStreamOutput] = useState('');
  const [runMeta, setRunMeta] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', repo_url: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', task_class: 'architecture_plan', risk_level: 'low' });
  const outputRef = useRef<HTMLDivElement>(null);

  const fetchProjects = () => fetch(`${API}/api/projects`).then(r => r.json()).then(setProjects).catch(() => {});
  const fetchTasks = (pid: string) => fetch(`${API}/api/tasks?projectId=${pid}`).then(r => r.json()).then(setTasks).catch(() => {});
  const fetchPendingRuns = () => fetch(`${API}/api/runs?status=completed`).then(r => r.json()).then(setPendingRuns).catch(() => {});

  useEffect(() => { fetchProjects(); fetchPendingRuns(); }, []);
  useEffect(() => { if (selectedProject) fetchTasks(selectedProject.id); }, [selectedProject]);
  useEffect(() => { if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight; }, [streamOutput]);

  const createProject = async () => {
    await fetch(`${API}/api/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProject) });
    setShowProjectForm(false); setNewProject({ name: '', repo_url: '' }); fetchProjects();
  };

  const createTask = async () => {
    if (!selectedProject) return;
    await fetch(`${API}/api/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newTask, project_id: selectedProject.id }) });
    setShowTaskForm(false); setNewTask({ title: '', description: '', task_class: 'architecture_plan', risk_level: 'low' }); fetchTasks(selectedProject.id);
  };

  const runClaude = async () => {
    if (!selectedTask) return;
    setIsRunning(true); setStreamOutput(''); setRunMeta(null);
    const response = await fetch(`${API}/api/runs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: selectedTask.id, goal: selectedTask.description || selectedTask.title, projectContext: selectedProject?.name || '' })
    });
    if (!response.body) { setIsRunning(false); return; }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'chunk') setStreamOutput(p => p + data.content);
          if (data.type === 'done') { setRunMeta(data); fetchPendingRuns(); }
        } catch {}
      }
    }
    setIsRunning(false);
  };

  const decide = async (runId: string, decision: 'approved' | 'rejected') => {
    await fetch(`${API}/api/approvals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_run_id: runId, decision }) });
    fetchPendingRuns();
  };

  const badge = (text: string, color: string) => (
    <span className={`px-2 py-0.5 rounded text-xs font-mono ${color}`}>{text}</span>
  );

  return (
    <div className="p-4 h-full">
      <h1 className="text-xl font-bold mb-4 text-white">⚡ Cockpit</h1>
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-120px)]">

        {/* Panel 1 — Projects */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Projects</h2>
            <button onClick={() => setShowProjectForm(p => !p)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">+ New</button>
          </div>
          {showProjectForm && (
            <div className="mb-3 space-y-2">
              <input className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-600" placeholder="Project name" value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} />
              <input className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-600" placeholder="Repo URL (optional)" value={newProject.repo_url} onChange={e => setNewProject(p => ({ ...p, repo_url: e.target.value }))} />
              <div className="flex gap-2">
                <button onClick={createProject} className="flex-1 bg-green-700 hover:bg-green-600 text-white text-sm py-1 rounded">Create</button>
                <button onClick={() => setShowProjectForm(false)} className="flex-1 bg-gray-700 text-white text-sm py-1 rounded">Cancel</button>
              </div>
            </div>
          )}
          <div className="overflow-y-auto flex-1 space-y-1">
            {projects.length === 0 && <p className="text-gray-500 text-xs">No projects yet</p>}
            {projects.map(p => (
              <div key={p.id} onClick={() => setSelectedProject(p)} className={`p-2 rounded cursor-pointer text-sm flex items-center justify-between ${selectedProject?.id === p.id ? 'bg-blue-900 border border-blue-600' : 'bg-gray-800 hover:bg-gray-750'}`}>
                <span className="text-white truncate">{p.name}</span>
                {badge(p.status, 'bg-green-900 text-green-300')}
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2 — Task Queue */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Task Queue {selectedProject && <span className="text-gray-500 normal-case">— {selectedProject.name}</span>}</h2>
            {selectedProject && <button onClick={() => setShowTaskForm(p => !p)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">+ New</button>}
          </div>
          {showTaskForm && (
            <div className="mb-3 space-y-2">
              <input className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-600" placeholder="Task title" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
              <textarea className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-600 h-16 resize-none" placeholder="Description / goal" value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} />
              <div className="flex gap-2">
                <select className="flex-1 bg-gray-800 text-white text-sm p-2 rounded border border-gray-600" value={newTask.task_class} onChange={e => setNewTask(p => ({ ...p, task_class: e.target.value }))}>
                  {TASK_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="w-24 bg-gray-800 text-white text-sm p-2 rounded border border-gray-600" value={newTask.risk_level} onChange={e => setNewTask(p => ({ ...p, risk_level: e.target.value }))}>
                  {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={createTask} className="flex-1 bg-green-700 hover:bg-green-600 text-white text-sm py-1 rounded">Create</button>
                <button onClick={() => setShowTaskForm(false)} className="flex-1 bg-gray-700 text-white text-sm py-1 rounded">Cancel</button>
              </div>
            </div>
          )}
          {!selectedProject && <p className="text-gray-500 text-xs">Select a project first</p>}
          <div className="overflow-y-auto flex-1 space-y-1">
            {tasks.map(t => (
              <div key={t.id} onClick={() => setSelectedTask(t)} className={`p-2 rounded cursor-pointer text-sm ${selectedTask?.id === t.id ? 'bg-indigo-900 border border-indigo-600' : 'bg-gray-800 hover:bg-gray-750'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-white truncate">{t.title}</span>
                  {badge(t.risk_level, t.risk_level === 'high' ? 'bg-red-900 text-red-300' : t.risk_level === 'medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-700 text-gray-300')}
                </div>
                <div className="mt-1">{badge(t.task_class, 'bg-purple-900 text-purple-300')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3 — Run Console */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Run Console</h2>
            <button onClick={runClaude} disabled={!selectedTask || isRunning} className={`text-xs px-3 py-1 rounded font-mono ${!selectedTask || isRunning ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-emerald-700 hover:bg-emerald-600 text-white'}`}>
              {isRunning ? '⏳ Running...' : '▶ Run with Claude'}
            </button>
          </div>
          {selectedTask && <p className="text-xs text-gray-500 mb-2 truncate">Task: {selectedTask.title}</p>}
          <div ref={outputRef} className="flex-1 overflow-y-auto bg-black rounded p-3 font-mono text-xs text-green-400 whitespace-pre-wrap leading-relaxed">
            {streamOutput || <span className="text-gray-600">Output will appear here...</span>}
          </div>
          {runMeta && (
            <div className="mt-2 flex gap-3 text-xs text-gray-400 font-mono">
              <span>⏱ {runMeta.latency_ms}ms</span>
              <span>📥 {runMeta.token_input} tok</span>
              <span>📤 {runMeta.token_output} tok</span>
              <span className="text-emerald-400">💰 ${runMeta.cost_usd?.toFixed(4)}</span>
            </div>
          )}
        </div>

        {/* Panel 4 — Approval Gate */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Approval Gate</h2>
            <button onClick={fetchPendingRuns} className="text-xs text-gray-500 hover:text-white">↻ Refresh</button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-2">
            {pendingRuns.length === 0 && <p className="text-gray-500 text-xs">No runs awaiting approval</p>}
            {pendingRuns.map(r => (
              <div key={r.id} className="bg-gray-800 rounded p-3 space-y-2">
                <p className="text-white text-sm font-medium truncate">{r.task_title}</p>
                <p className="text-gray-400 text-xs line-clamp-3">{r.output_summary}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">⏱ {r.latency_ms}ms · 💰 ${Number(r.cost_usd).toFixed(4)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => decide(r.id, 'approved')} className="text-xs bg-green-800 hover:bg-green-700 text-green-200 px-2 py-1 rounded">✅ Approve</button>
                    <button onClick={() => decide(r.id, 'rejected')} className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-2 py-1 rounded">❌ Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
