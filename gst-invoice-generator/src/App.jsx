import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateInvoice from './pages/CreateInvoice'
import CreateReceipt from './pages/CreateReceipt'
import Expenses from './pages/Expenses'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Route for Creating New Invoice */}
        <Route path="/create-invoice" element={<CreateInvoice />} />
        
        {/* Route for Editing Existing Invoice (Passing the ID) */}
        <Route path="/edit-invoice/:id" element={<CreateInvoice />} />

        {/* Route for Creating New Receipt */}
        <Route path="/create-receipt" element={<CreateReceipt />} />
        
        {/* Route for Editing Existing Receipt (Passing the ID) */}
        <Route path="/edit-receipt/:id" element={<CreateReceipt />} />

        {/* Expenses Manager module */}
        <Route path="/expenses" element={<Expenses />} />

        {/* Analytics: profit & loss across revenue and expenses */}
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  )
}