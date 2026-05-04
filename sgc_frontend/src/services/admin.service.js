import api from './api'

export async function getTiendas() {
  const res = await api.get('/tiendas')
  return res.data
}