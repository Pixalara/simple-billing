import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateInvoice from './pages/CreateInvoice' // <-- Import this

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add the new route */}
        <Route path="/create-invoice" element={<CreateInvoice />} />
      </Routes>
    </BrowserRouter>
  )
}