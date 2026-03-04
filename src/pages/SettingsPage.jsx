import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { Camera, Sun, Moon, Lock, LogOut, Info, ChevronRight } from 'lucide-react'
import { Avatar } from './HomePage'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

export default function SettingsPage() {
  const { user, token, logout, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [avatar, setAvatar] = useState(user?.avatar || null)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPasswordField, setShowPasswordField] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target.result)
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, username, avatar, password: newPassword || undefined })
      })
      if (res.ok) {
        const updated = await res.json()
        updateUser(updated)
        setSaved(true)
        setNewPassword('')
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {}
    setSaving(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const inputStyle = {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar page-enter"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="px-5 pt-10 pb-4">
        <h1 className="text-2xl font-extrabold font-syne mb-6" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>

        {/* Profile */}
        <section className="mb-6">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Profile
          </p>

          {/* Avatar */}
          <div className="flex justify-center mb-5">
            <label className="relative cursor-pointer">
              <Avatar user={{ ...user, avatar }} size={20} />
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2"
                style={{ background: 'var(--accent-purple)', borderColor: 'var(--bg-primary)' }}>
                <Camera size={12} className="text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Username
              </label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="mb-6">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Appearance
          </p>
          <div className="flex items-center justify-between p-4 rounded-2xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              {theme === 'dark'
                ? <Moon size={18} style={{ color: 'var(--accent-purple)' }} />
                : <Sun size={18} style={{ color: '#F59E0B' }} />
              }
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="w-12 h-6 rounded-full relative transition-all"
              style={{ background: theme === 'dark' ? 'var(--accent-purple)' : 'var(--bg-tertiary)' }}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${theme === 'dark' ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </section>

        {/* Account */}
        <section className="mb-6">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Account
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setShowPasswordField(!showPasswordField)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <Lock size={16} style={{ color: 'var(--text-secondary)' }} />
              <span className="flex-1 text-left text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Change Password
              </span>
              <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>

            {showPasswordField && (
              <input
                type="password"
                placeholder="New password..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <LogOut size={16} style={{ color: '#EF4444' }} />
              <span className="text-sm font-semibold" style={{ color: '#EF4444' }}>Sign Out</span>
            </button>
          </div>
        </section>

        {/* About */}
        <section className="mb-4">
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            About
          </p>
          <div className="p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <Info size={16} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p className="text-sm font-semibold font-syne" style={{ color: 'var(--text-primary)' }}>VibeChat</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Version 1.0 — Demo</p>
            </div>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full py-4 rounded-full font-bold text-base text-white mt-2 transition-opacity"
          style={{
            background: saved ? '#22C55E' : 'var(--accent-purple)',
            opacity: saving ? 0.7 : 1
          }}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>

        <div className="h-4" />
      </div>
    </div>
  )
}
