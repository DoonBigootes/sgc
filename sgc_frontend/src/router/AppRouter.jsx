import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Dashboard from '../pages/dashboard/Dashboard'
import AuthGuard from '../components/guards/AuthGuard'
import AppLayout from '../components/layout/AppLayout'

// import de paginas
// Catalogo
import Vendedores from '../pages/catalogos/vendedores'
import Productos from '../pages/catalogos/productos'
import Clientes from '../pages/catalogos/clientes'
import Catalogos from '../pages/catalogos/catalogos'
import Existencia from '../pages/inventario/Existencia'
import Traslados from '../pages/inventario/traslados'

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
          <Route path='/catalogos/clientes' element={<Clientes />} />
          <Route path='/catalogos/productos' element={<Productos />} />

          {/* Inventario  */}
          <Route path='/inventario/existencia' element={<Existencia />} />
          <Route path='/inventario/traslados' element={<Traslados />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}