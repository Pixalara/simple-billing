import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateInvoice from './pages/CreateInvoice'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Route for Creating New */}
        <Route path="/create-invoice" element={<CreateInvoice />} />
        
        {/* Route for Editing Existing (Passing the ID) */}
        <Route path="/edit-invoice/:id" element={<CreateInvoice />} />
      </Routes>
    </BrowserRouter>
  )
}