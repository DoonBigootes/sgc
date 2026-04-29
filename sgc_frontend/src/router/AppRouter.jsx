import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Dashboard from '../pages/dashboard/Dashboard'
import AuthGuard from '../components/guards/AuthGuard'
import AppLayout from '../components/layout/AppLayout'

// import de paginas
// Catalogo
import Catalogos from '../pages/catalogos/Catalogos'
import Vendedores from '../pages/catalogos/Vendedores'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Catalogos */}
          <Route path="/catalogos/general" element={<Catalogos />} />
          <Route path="/catalogos/vendedores" element={<Vendedores />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}