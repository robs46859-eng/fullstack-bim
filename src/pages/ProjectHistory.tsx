export default function ProjectHistory() {
  return (
    <div className="p-8 h-full overflow-auto">
      <h1 className="text-3xl font-bold mb-6">Project History</h1>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Historical Records</h2>
        <p className="text-gray-400 mb-4">
          View past projects, completed tasks, and archived runs.
        </p>
        <p className="text-gray-500 text-sm">
          Navigate to the Cockpit for full project management and historical data visualization.
        </p>
      </div>
    </div>
  )
}
