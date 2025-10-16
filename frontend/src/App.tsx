import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Header from './components/Header'
import Home from './pages/Home'
import QuestDetails from './pages/QuestDetails'
import Profile from './pages/Profile'
import Rewards from './pages/Rewards'
import CompanyRegister from './pages/company/CompanyRegister'
import CompanyLogin from './pages/company/CompanyLogin'
import CompanyDashboard from './pages/company/CompanyDashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Student Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/quest/:id" element={<QuestDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rewards" element={<Rewards />} />
          
          {/* Company Routes */}
          <Route path="/company/register" element={<CompanyRegister />} />
          <Route path="/company/login" element={<CompanyLogin />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
        </Routes>
      </main>
    </div>
  )
}

export default App


