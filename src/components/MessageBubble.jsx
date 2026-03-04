import { useState } from 'react'
import { Play, Plus, Radio, Music } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function PlaylistCard({ payload, isMine, otherUserId }) {
  const { playPlaylist } = usePlayer()
  const { emit } = useSocket()
  const { user, token } = useAuth()
  const [saved, setSaved] = useState(false)

  const handlePlay = () => {
    if (payload.songs?.length) {
      playPlaylist(payload.songs)
    }
  }

  const handleSave = async () => {
    try {
      await fetch(`${API}/music/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: payload.name, songs: payload.songs })
      })
      setSaved(true)
    } catch {}
  }

  const handleVibe = () => {
    if (payload.songs?.[0]) {
      emit('vibe_request', { to: otherUserId, song: payload.songs[0], playlist: payload })
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden border max-w-[260px]"
      style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>
      {/* Cover mosaic */}
      <div className="h-24 bg-gradient-to-br from-purple-700 to-teal-600 flex items-center justify-center">
        <Music size={32} className="text-white opacity-80" />
      </div>

      <div className="p-3">
        <p className="font-bold text-sm font-syne" style={{ color: 'var(--text-primary)' }}>
          {payload.name}
        </p>
        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
          by @{payload.owner_username} · {payload.songs?.length || 0} songs
        </p>

        {/* Song list preview */}
        <div className="space-y-1 mb-3 max-h-20 overflow-y-auto no-scrollbar">
          {(payload.songs || []).slice(0, 5).map((song, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <button onClick={() => usePlayer().playSong(song)} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent-purple)' }}>
                <Play size={8} fill="white" color="white" />
              </button>
              <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{song.title}</span>
              <span className="ml-auto shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {formatDuration(song.duration || 0)}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button onClick={handlePlay}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ background: 'var(--accent-purple)' }}>
            <Play size={10} fill="white" /> Play
          </button>
          {!isMine && !saved && (
            <button onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold border"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
              <Plus size={10} /> Save
            </button>
          )}
          <button onClick={handleVibe}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'var(--bg-secondary)', color: 'var(--accent-teal)' }}>
            <Radio size={10} /> Vibe
          </button>
        </div>
      </div>
    </div>
  )
}

function VibeInviteCard({ payload, isMine, onAccept, onDecline }) {
  if (isMine) {
    return (
      <div className="rounded-2xl px-4 py-3 border max-w-[220px]"
        style={{ background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.3)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🎵</span>
          <span className="text-xs font-semibold text-purple-400">Vibe Request Sent</span>
        </div>
        <p className="text-sm font-syne" style={{ color: 'var(--text-primary)' }}>
          {payload?.song?.title || 'Unknown Song'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Waiting for response...</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl px-4 py-3 border max-w-[240px]"
      style={{ background: 'rgba(124,58,237,0.1)', borderColor: 'rgba(124,58,237,0.3)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🎵</span>
        <span className="text-xs font-semibold text-purple-400">Vibe Request</span>
      </div>
      <p className="text-sm font-bold font-syne mb-0.5" style={{ color: 'var(--text-primary)' }}>
        {payload?.song?.title || 'Unknown'}
      </p>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
        {payload?.song?.artist || 'Unknown Artist'}
      </p>
      <div className="flex gap-2">
        <button onClick={onAccept}
          className="flex-1 py-1.5 rounded-full text-xs font-bold text-white"
          style={{ background: 'var(--accent-purple)' }}>
          Accept
        </button>
        <button onClick={onDecline}
          className="flex-1 py-1.5 rounded-full text-xs font-medium border"
          style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
          Decline
        </button>
      </div>
    </div>
  )
}

export default function MessageBubble({ message, isMine, otherUserId, onVibeAccept, onVibeDecline }) {
  const isSystem = message.type === 'call_ended'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
          📞 {message.content || 'Call ended'}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {message.type === 'text' && (
          <div className={`px-3.5 py-2.5 rounded-2xl ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'} text-sm leading-relaxed`}
            style={{
              background: isMine ? 'var(--accent-purple)' : 'var(--bg-secondary)',
              color: isMine ? '#fff' : 'var(--text-primary)',
              border: isMine ? 'none' : `1px solid var(--border)`
            }}>
            {message.content}
          </div>
        )}

        {message.type === 'playlist_card' && (
          <PlaylistCard payload={message.payload} isMine={isMine} otherUserId={otherUserId} />
        )}

        {message.type === 'vibe_invite' && (
          <VibeInviteCard
            payload={message.payload}
            isMine={isMine}
            onAccept={() => onVibeAccept?.(message.payload?.session_id)}
            onDecline={() => onVibeDecline?.(message.payload?.session_id)}
          />
        )}

        <span className="text-[10px] mt-0.5 px-1" style={{ color: 'var(--text-secondary)' }}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}
