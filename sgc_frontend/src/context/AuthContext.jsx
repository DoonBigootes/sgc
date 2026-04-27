import { createContext, useState } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('sgc_user')) || null
  )
  const [token, setToken] = useState(
    () => localStorage.getItem('sgc_token') || null
  )

  function login(userData, tokenData) {
    localStorage.setItem('sgc_user', JSON.stringify(userData))
    localStorage.setItem('sgc_token', tokenData)
    setUser(userData)
    setToken(tokenData)
  }

  function logout() {
    localStorage.removeItem('sgc_user')
    localStorage.removeItem('sgc_token')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}