/**
 * App Component - Main application entry point
 * 
 * Requirements: 3.3, 3.4
 * - Dashboard, Clients, Invoices, and InvoiceEditor are protected routes
 * - ShareableInvoice remains publicly accessible
 */

import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Invoices from './pages/Invoices'
import InvoiceEditor from './pages/InvoiceEditor'
import ShareableInvoice from './pages/ShareableInvoice'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
    return (
        <AuthProvider>
            <AppProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    
                    {/* Shareable invoice - publicly accessible (Requirement 3.4) */}
                    <Route path="/invoice/:id" element={<ShareableInvoice />} />

                    {/* Protected routes with layout (Requirement 3.3) */}
                    <Route element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/invoices/new" element={<InvoiceEditor />} />
                        <Route path="/invoices/:id/edit" element={<InvoiceEditor />} />
                    </Route>
                </Routes>
            </AppProvider>
        </AuthProvider>
    )
}

export default App
