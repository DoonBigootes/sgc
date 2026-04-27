import api from './api'

export async function loginService(usuario, contra) {
  const res = await api.post('/auth/login', { usuario, contra })
  return res.data
}