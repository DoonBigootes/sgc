// ─── Funciones genéricas para catálogos simples ─────────────────────────────
// Slugs usados en el backend:
//   marcas, tipos-cliente, tipos-producto, clasificaciones,
//   unidades-medida, bancos, tipos-pago, tipos-factura,
//   tipos-nota-credito, tipos-traslado, tipos-compra

import api from './api'

export async function getCatalogo(slug) {
  const res = await api.get(`/${slug}`)
  return res.data
}

export async function createCatalogo(slug, data) {
  const res = await api.post(`/${slug}`, data)
  return res.data
}

export async function updateCatalogo(slug, id, data) {
  const res = await api.put(`/${slug}/${id}`, data)
  return res.data
}

export async function deleteCatalogo(slug, id) {
  const res = await api.delete(`/${slug}/${id}`)
  return res.data
}

// ─── Vendedores ───────────────────────────────────────────────────────────────
export const getVendedores  = ()         => api.get('/vendedores').then(r => r.data)
export const createVendedor = (data)     => api.post('/vendedores', data)
export const updateVendedor = (id, data) => api.put(`/vendedores/${id}`, data)
export const deleteVendedor = (id)       => api.delete(`/vendedores/${id}`)

// ─── Clientes ─────────────────────────────────────────────────────────────────
export const getClientes     = ()         => api.get('/clientes').then(r => r.data)
export const createCliente   = (data)     => api.post('/clientes', data)
export const updateCliente   = (id, data) => api.put(`/clientes/${id}`, data)
export const deleteCliente   = (id)       => api.delete(`/clientes/${id}`)
export const getTiposCliente = ()         => api.get('/tipos-cliente').then(r => r.data)

// ─── Productos ────────────────────────────────────────────────────────────────
export const getProductos   = (params)   => api.get('/productos', { params }).then(r => r.data)
export const getProducto    = (id)       => api.get(`/productos/${id}`).then(r => r.data)
export const createProducto = (data)     => api.post('/productos', data).then(r => r.data)
export const updateProducto = (id, data) => api.put(`/productos/${id}`, data).then(r => r.data)
export const toggleProducto = (id, data) => api.patch(`/productos/${id}/estado`, data).then(r => r.data)

// Catálogos dependientes de productos
export const getTiposProducto   = () => api.get('/tipos-producto').then(r => r.data)
export const getClasificaciones = () => api.get('/clasificaciones').then(r => r.data)
export const getMarcas          = () => api.get('/marcas').then(r => r.data)
export const getUnidadesMedida  = () => api.get('/unidades-medida').then(r => r.data)