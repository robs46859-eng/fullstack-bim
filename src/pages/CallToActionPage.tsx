import { Link } from 'react-router-dom'

export default function CallToActionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-6">Features & Capabilities</h1>

        <div className="space-y-8">
          <section className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-3">🤖 AI-Powered Planning Lane</h2>
            <p className="text-gray-300">
              Automatically generate detailed implementation plans for any BIM task using Claude, including architecture planning, code generation, structural analysis, and deployment strategies.
            </p>
          </section>

          <section className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-3">✓ Compliance & Approval Gates</h2>
            <p className="text-gray-300">
              Build human-in-the-loop workflows with configurable approval gates, risk assessment, and audit trails for mission-critical decisions.
            </p>
          </section>

          <section className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-3">⚡ Cockpit Dashboard</h2>
            <p className="text-gray-300">
              Monitor, manage, and steer your BIM projects from a unified control center. Track project health, task queues, and AI model performance in real-time.
            </p>
          </section>

          <section className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-3">📊 Detailed Analytics</h2>
            <p className="text-gray-300">
              Understand your project execution with comprehensive metrics on latency, token usage, costs, and decision outcomes.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/dashboard"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition"
          >
            Launch Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
