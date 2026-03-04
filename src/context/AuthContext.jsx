import { createContext, useContext, useState, useEffect } from 'react'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('vc_token')
    if (savedToken) {
      fetchMe(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchMe = async (t) => {
    try {
      const res = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setToken(t)
      } else {
        localStorage.removeItem('vc_token')
      }
    } catch (e) {
      localStorage.removeItem('vc_token')
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    localStorage.setItem('vc_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const signup = async (formData) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Signup failed')
    localStorage.setItem('vc_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('vc_token')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updated) => setUser(updated)

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
