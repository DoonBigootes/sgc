import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sgc_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('sgc_token')
      localStorage.removeItem('sgc_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api