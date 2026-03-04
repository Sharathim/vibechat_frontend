import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import { useNavigate } from 'react-router-dom'
import { Phone, PhoneOff } from 'lucide-react'

export default function CallModal() {
  const { callIncoming, dismissCallIncoming, emit } = useSocket()
  const navigate = useNavigate()

  if (!callIncoming) return null

  const handleAccept = () => {
    emit('call_accept', { to: callIncoming.from, session_id: callIncoming.session_id })
    dismissCallIncoming()
    navigate(`/call/${callIncoming.from}?session=${callIncoming.session_id}&incoming=1`)
  }

  const handleDecline = () => {
    emit('call_decline', { to: callIncoming.from, session_id: callIncoming.session_id })
    dismissCallIncoming()
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-start pt-8 px-4 fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full rounded-3xl p-6 modal-enter"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <p className="text-center text-xs uppercase tracking-widest mb-4 font-semibold"
          style={{ color: 'var(--text-secondary)' }}>Incoming Call</p>

        {/* Avatar */}
        <div className="flex justify-center mb-3 relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold font-syne"
            style={{ background: 'var(--accent-purple)' }}>
            {callIncoming.from_name?.[0] || '?'}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full pulse-ring"
              style={{ border: '2px solid var(--accent-teal)' }} />
          </div>
        </div>

        <h3 className="text-center font-bold text-xl font-syne mb-1" style={{ color: 'var(--text-primary)' }}>
          {callIncoming.from_name}
        </h3>
        <p className="text-center text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          VibeChat Voice Call
        </p>

        <div className="flex justify-center gap-10">
          <button onClick={handleDecline}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: '#EF4444' }}>
            <PhoneOff size={24} className="text-white" />
          </button>
          <button onClick={handleAccept}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: '#22C55E' }}>
            <Phone size={24} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
