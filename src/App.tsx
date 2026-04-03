import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardOverviewPage from './pages/DashboardOverviewPage'
import ComplianceQueuePage from './pages/ComplianceQueuePage'
import ProjectHistory from './pages/ProjectHistory'
import StructuralAnalysisPage from './pages/StructuralAnalysisPage'
import ViewportsPage from './pages/ViewportsPage'
import LandingPage from './pages/LandingPage'
import CallToActionPage from './pages/CallToActionPage'
import CockpitPage from './pages/CockpitPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cta" element={<CallToActionPage />} />
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="compliance" element={<ComplianceQueuePage />} />
          <Route path="history" element={<ProjectHistory />} />
          <Route path="structural" element={<StructuralAnalysisPage />} />
          <Route path="viewports" element={<ViewportsPage />} />
          <Route path="cockpit" element={<CockpitPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
