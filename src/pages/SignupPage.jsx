import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Radio, Camera } from 'lucide-react'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [avatar, setAvatar] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleAvatar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setAvatar(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup({ ...form, avatar })
      navigate('/home')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar page-enter"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="flex-1 flex flex-col justify-center px-8 py-10 relative">
        {/* Decorative */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, var(--accent-teal), transparent)' }} />
        </div>

        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'var(--accent-purple)', boxShadow: '0 0 24px var(--accent-glow)' }}>
            <Radio size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold font-syne gradient-text">Join VibeChat</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Create your account</p>
        </div>

        {/* Avatar upload */}
        <div className="flex justify-center mb-6">
          <label className="w-20 h-20 rounded-full cursor-pointer relative overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--bg-tertiary)', border: '2px dashed var(--border)' }}>
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Camera size={20} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>Photo</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleAvatar} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {[
            { name: 'name', label: 'FULL NAME', placeholder: 'John Doe', type: 'text' },
            { name: 'username', label: 'USERNAME', placeholder: 'johndoe', type: 'text' },
            { name: 'email', label: 'EMAIL', placeholder: 'you@example.com', type: 'email' },
            { name: 'password', label: 'PASSWORD', placeholder: '••••••••', type: 'password' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent-purple)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-bold text-base text-white mt-2 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-teal))',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-bold" style={{ color: 'var(--accent-purple)' }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
