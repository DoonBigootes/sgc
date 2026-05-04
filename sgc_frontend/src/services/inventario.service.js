import api from './api'

// ─── Inventario ───────────────────────────────────────────────────────────────
export async function getInventario(params) {
  const res = await api.get('/inventario', { params })
  return res.data
}

// ─── Traslados ────────────────────────────────────────────────────────────────
export const getTraslados  = (params) => api.get('/traslados', { params }).then(r => r.data)
export const getTraslado   = (id)     => api.get(`/traslados/${id}`).then(r => r.data)
export const createTraslado = (data)  => api.post('/traslados', data).then(r => r.data)

// ─── Cierre de inventario ─────────────────────────────────────────────────────
export const getCierresInventario  = (params) => api.get('/cierre-inventario', { params }).then(r => r.data)
export const createCierreInventario = (data)  => api.post('/cierre-inventario', data).then(r => r.data)