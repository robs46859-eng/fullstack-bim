import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-blue-400">StelarBIM</h1>
          <p className="text-xs text-gray-500 mt-1">AI-Powered BIM Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition ${
                isActive
                  ? 'bg-blue-900 text-blue-200'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            📊 Overview
          </NavLink>

          <NavLink
            to="/dashboard/compliance"
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition ${
                isActive
                  ? 'bg-blue-900 text-blue-200'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            ✓ Compliance
          </NavLink>

          <NavLink
            to="/dashboard/structural"
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition ${
                isActive
                  ? 'bg-blue-900 text-blue-200'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            🏗️ Structural
          </NavLink>

          <NavLink
            to="/dashboard/viewports"
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition ${
                isActive
                  ? 'bg-blue-900 text-blue-200'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            👁️ Viewports
          </NavLink>

          <NavLink
            to="/dashboard/history"
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition ${
                isActive
                  ? 'bg-blue-900 text-blue-200'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            📜 History
          </NavLink>

          <NavLink
            to="/dashboard/cockpit"
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition ${
                isActive
                  ? 'bg-blue-900 text-blue-200'
                  : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            ⚡ Cockpit
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
          <p>v0.0.1</p>
          <p className="mt-2">
            For support: <a href="mailto:support@arkhamprison.com" className="text-blue-400 hover:underline">support@arkhamprison.com</a>
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
