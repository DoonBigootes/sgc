// ─── Funciones genéricas para catálogos simples ─────────────────────────────
// Ejemplo de slugs esperados por el backend:
//   marcas, tipos-cliente, tipos-producto, clasificaciones,
//   unidades-medida, bancos, tipos-pago, tipos-factura,
//   tipos-nota-credito, tipos-traslado, tipos-compra
// Ajustar los slugs si el backend los maneja diferente (ej. snake_case).

import api from './api'

/**
 * Obtiene todos los registros de un catálogo.
 * @param {string} slug - Segmento de URL del catálogo
 * @returns {Promise<Array>}
 */
export async function getCatalogo(slug) {
  const res = await api.get(`/${slug}`)
  return res.data
}

/**
 * Crea un nuevo registro en un catálogo.
 * @param {string} slug - Segmento de URL del catálogo
 * @param {{ nombre: string }} data
 * @returns {Promise<Object>}
 */
export async function createCatalogo(slug, data) {
  const res = await api.post(`/${slug}`, data)
  return res.data
}

/**
 * Actualiza un registro existente en un catálogo.
 * @param {string} slug - Segmento de URL del catálogo
 * @param {number} id
 * @param {{ nombre: string }} data
 * @returns {Promise<Object>}
 */
export async function updateCatalogo(slug, id, data) {
  const res = await api.put(`/${slug}/${id}`, data)
  return res.data
}

/**
 * Elimina un registro de un catálogo.
 * @param {string} slug - Segmento de URL del catálogo
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteCatalogo(slug, id) {
  const res = await api.delete(`/${slug}/${id}`)
  return res.data
}


export const getVendedores  = ()        => api.get('/vendedores').then(r => r.data)
export const createVendedor = (data)    => api.post('/vendedores', data)
export const updateVendedor = (id,data) => api.put(`/vendedores/${id}`, data)
export const deleteVendedor = (id)      => api.delete(`/vendedores/${id}`)