export default function ComplianceQueuePage() {
  return (
    <div className="p-8 h-full overflow-auto">
      <h1 className="text-3xl font-bold mb-6">Compliance Queue</h1>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
        <p className="text-gray-400 mb-4">
          This page displays tasks awaiting compliance review and approval gates.
        </p>
        <p className="text-gray-500 text-sm">
          Use the Cockpit dashboard to manage approval decisions and view task history.
        </p>
      </div>
    </div>
  )
}
