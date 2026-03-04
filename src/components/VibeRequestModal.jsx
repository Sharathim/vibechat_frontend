import { useSocket } from '../context/SocketContext'
import { useNavigate } from 'react-router-dom'
import { Radio, X } from 'lucide-react'

export default function VibeRequestModal() {
  const { vibeIncoming, dismissVibeIncoming, emit } = useSocket()
  const navigate = useNavigate()

  if (!vibeIncoming) return null

  const handleAccept = () => {
    emit('vibe_accept', { session_id: vibeIncoming.session_id })
    emit('vibe_join_room', { session_id: vibeIncoming.session_id })
    dismissVibeIncoming()
    navigate(`/vibe/${vibeIncoming.session_id}`)
  }

  const handleDecline = () => {
    emit('vibe_decline', { session_id: vibeIncoming.session_id })
    dismissVibeIncoming()
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-end pb-24 px-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full rounded-3xl p-6 modal-enter"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        {/* Animated rings */}
        <div className="flex justify-center mb-4 relative">
          <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
            style={{ background: 'var(--accent-purple)' }}>
            <Radio size={28} className="text-white" />
          </div>
          <div className="absolute top-0 w-16 h-16 rounded-full pulse-ring"
            style={{ border: '2px solid var(--accent-purple)' }} />
        </div>

        <h3 className="text-center font-bold text-lg font-syne mb-1" style={{ color: 'var(--text-primary)' }}>
          Vibe Request
        </h3>
        <p className="text-center text-sm mb-0.5" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {vibeIncoming.from_name}
          </span> wants to vibe with you
        </p>
        {vibeIncoming.song && (
          <div className="flex items-center justify-center gap-2 mt-3 mb-5 px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--bg-tertiary)' }}>
            <span className="text-xl">🎵</span>
            <div>
              <p className="text-sm font-semibold font-syne" style={{ color: 'var(--text-primary)' }}>
                {vibeIncoming.song.title}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {vibeIncoming.song.artist}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 py-3 rounded-full font-semibold text-sm border"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-3 rounded-full font-bold text-sm text-white"
            style={{ background: 'var(--accent-purple)', boxShadow: '0 0 20px var(--accent-glow)' }}>
            Join Vibe 🎵
          </button>
        </div>
      </div>
    </div>
  )
}
