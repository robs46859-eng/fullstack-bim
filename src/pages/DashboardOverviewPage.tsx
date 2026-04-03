export default function DashboardOverviewPage() {
  return (
    <div className="p-8 h-full overflow-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm font-semibold mb-2">Active Projects</h3>
          <p className="text-4xl font-bold text-blue-400">—</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm font-semibold mb-2">Pending Tasks</h3>
          <p className="text-4xl font-bold text-yellow-400">—</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-gray-400 text-sm font-semibold mb-2">Completed Runs</h3>
          <p className="text-4xl font-bold text-green-400">—</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <p className="text-gray-400">Navigate to the Cockpit to manage projects and view activity.</p>
      </div>
    </div>
  )
}
