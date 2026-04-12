import { Suspense, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, Center, useGLTF, Html } from '@react-three/drei'
import type { Group } from 'three'

// ── Model loader ─────────────────────────────────────────────────────────────

function ModelLoader({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const ref = useRef<Group>(null)
  return (
    <Center>
      <primitive ref={ref} object={scene} />
    </Center>
  )
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-white text-sm bg-black/60 px-4 py-2 rounded-lg">Loading model…</div>
    </Html>
  )
}

// ── 3D Viewport ──────────────────────────────────────────────────────────────

function Viewport({ modelUrl }: { modelUrl: string | null }) {
  return (
    <Canvas
      camera={{ position: [5, 5, 5], fov: 50 }}
      shadows
      style={{ background: '#0f1117' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <Environment preset="city" />

      {modelUrl ? (
        <Suspense fallback={<LoadingFallback />}>
          <ModelLoader url={modelUrl} />
        </Suspense>
      ) : (
        <Html center>
          <div className="text-gray-400 text-sm text-center pointer-events-none select-none">
            <p className="text-3xl mb-2">📦</p>
            <p>No model loaded</p>
            <p className="text-xs mt-1 text-gray-600">Upload a GLTF or GLB file to begin</p>
          </div>
        </Html>
      )}

      <Grid
        infiniteGrid
        cellSize={0.5}
        sectionSize={2}
        cellColor="#1e293b"
        sectionColor="#334155"
        fadeDistance={40}
        receiveShadow
      />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
    </Canvas>
  )
}

// ── Upload flow ───────────────────────────────────────────────────────────────

async function uploadModel(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const contentType = ext === 'glb' ? 'model/gltf-binary' : 'model/gltf+json'

  const urlRes = await fetch('/api/models/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType }),
  })
  const { uploadUrl, fields, publicUrl, error } = await urlRes.json()
  if (error) throw new Error(error.message)

  const form = new FormData()
  Object.entries(fields as Record<string, string>).forEach(([k, v]) => form.append(k, v))
  form.append('file', file)

  const uploadRes = await fetch(uploadUrl, { method: 'POST', body: form })
  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)

  return publicUrl as string
}

// ── Page ─────────────────────────────────────────────────────────────────────

type StoredModel = { name: string; url: string }

export default function ViewportsPage() {
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [savedModels, setSavedModels] = useState<StoredModel[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'glb' && ext !== 'gltf') {
      setUploadError('Only .glb and .gltf files are supported')
      return
    }
    setUploadError('')
    setUploading(true)
    try {
      const url = await uploadModel(file)
      const model = { name: file.name, url }
      setSavedModels(prev => [model, ...prev])
      setModelUrl(url)
    } catch {
      // Fallback: load from local object URL if GCS is not configured
      const localUrl = URL.createObjectURL(file)
      setModelUrl(localUrl)
      setSavedModels(prev => [{ name: file.name, url: localUrl }, ...prev])
    } finally {
      setUploading(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleUrlLoad = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    setModelUrl(trimmed)
    setSavedModels(prev => [{ name: trimmed.split('/').pop() ?? 'model', url: trimmed }, ...prev])
    setUrlInput('')
  }

  return (
    <div className="h-full flex flex-col bg-gray-950 text-white">

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 flex-wrap">
        <h1 className="text-sm font-bold uppercase tracking-widest text-gray-300 mr-2">3D Viewport</h1>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
        >
          {uploading ? 'Uploading…' : '⬆ Upload GLB/GLTF'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".glb,.gltf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />

        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlLoad()}
            placeholder="Or paste a model URL (GLB/GLTF)…"
            className="flex-1 min-w-0 bg-gray-800 border border-gray-700 text-xs text-white px-3 py-1.5 rounded focus:outline-none focus:border-blue-500 transition"
          />
          <button
            onClick={handleUrlLoad}
            className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1.5 rounded transition"
          >
            Load
          </button>
        </div>

        {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800">
            Loaded Models
          </div>
          <div className="flex-1 overflow-y-auto">
            {savedModels.length === 0 ? (
              <p className="text-xs text-gray-600 px-3 py-4">No models yet.</p>
            ) : (
              savedModels.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setModelUrl(m.url)}
                  className={`w-full text-left px-3 py-2 text-xs border-b border-gray-800 truncate transition ${
                    modelUrl === m.url
                      ? 'bg-blue-900/40 text-blue-300'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  📦 {m.name}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Viewport */}
        <div
          className="flex-1 relative"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Viewport modelUrl={modelUrl} />

          <div className="absolute bottom-3 right-3 text-[10px] text-gray-600 bg-black/40 px-2 py-1 rounded pointer-events-none">
            Left drag: orbit · Right drag: pan · Scroll: zoom
          </div>

          {!modelUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-dashed border-gray-700 rounded-xl px-12 py-8 text-center">
                <p className="text-4xl mb-3">🏗</p>
                <p className="text-gray-400 font-semibold">Drop a GLB or GLTF file here</p>
                <p className="text-gray-600 text-xs mt-1">or use the Upload button above</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
