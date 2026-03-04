import { NavLink } from 'react-router-dom'
import { Home, MessageCircle, Music2, User } from 'lucide-react'

const tabs = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/chats', icon: MessageCircle, label: 'Chats' },
  { to: '/music', icon: Music2, label: 'Music' },
  { to: '/settings', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="shrink-0 h-16 glass border-t z-40"
      style={{ borderColor: 'var(--border)' }}>
      <div className="flex h-full">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
                isActive
                  ? 'text-purple-500'
                  : 'opacity-50 hover:opacity-75'
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent-purple)' : 'var(--text-secondary)'
            })}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-purple-500/10' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-inter font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
