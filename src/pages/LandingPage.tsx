import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">StelarBIM</h1>
            <p className="text-sm text-gray-400">AI-Powered Building Information Modeling</p>
          </div>
          <nav className="space-x-4">
            <Link to="/" className="text-gray-300 hover:text-white transition">Home</Link>
            <Link to="/cta" className="text-gray-300 hover:text-white transition">Features</Link>
            <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 text-center">
        <h2 className="text-5xl font-bold mb-4">Next-Generation BIM Intelligence</h2>
        <p className="text-xl text-gray-300 max-w-2xl mb-8">
          Leverage AI-powered planning, structural analysis, and compliance automation to accelerate your building projects.
        </p>
        <div className="space-x-4">
          <Link
            to="/dashboard"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition"
          >
            Get Started
          </Link>
          <Link
            to="/cta"
            className="inline-block bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg font-semibold transition"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-900/50 py-6 text-center text-sm text-gray-500">
        <p>Copyright 2026 StelarBIM. All rights reserved. Domain: www.arkhamprison.com</p>
      </footer>
    </div>
  )
}
