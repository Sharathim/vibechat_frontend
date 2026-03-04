import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { useNavigate } from 'react-router-dom'
import { Play, Radio, TrendingUp, Music2 } from 'lucide-react'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

function Avatar({ user, size = 10 }) {
  if (user?.avatar) {
    return <img src={user.avatar} alt={user.name} className={`w-${size} h-${size} rounded-full object-cover`} />
  }
  const colors = ['from-purple-600 to-blue-600', 'from-teal-500 to-green-500', 'from-pink-600 to-rose-600']
  const c = user?.name?.charCodeAt(0) % colors.length || 0
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${colors[c]} flex items-center justify-center text-white font-bold font-syne`}
      style={{ fontSize: `${size * 1.2}px` }}>
      {user?.name?.[0] || '?'}
    </div>
  )
}

export { Avatar }

export default function HomePage() {
  const { user, token } = useAuth()
  const { playSong, playPlaylist } = usePlayer()
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [songsRes, plRes] = await Promise.all([
          fetch(`${API}/music/songs`),
          fetch(`${API}/music/playlists`, { headers: { Authorization: `Bearer ${token}` } })
        ])
        if (songsRes.ok) setSongs(await songsRes.json())
        if (plRes.ok) setPlaylists(await plRes.json())
      } catch {}
      setLoading(false)
    }
    load()
  }, [token])

  const colors = ['from-purple-700 to-indigo-700', 'from-teal-600 to-cyan-600', 'from-pink-600 to-rose-600', 'from-orange-600 to-amber-600']

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar page-enter"
      style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Good vibes, 👋
            </p>
            <h1 className="text-2xl font-extrabold font-syne" style={{ color: 'var(--text-primary)' }}>
              {user?.name?.split(' ')[0]}
            </h1>
          </div>
          <button onClick={() => navigate('/settings')}>
            <Avatar user={user} size={10} />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/chats')}
            className="flex items-center gap-3 p-4 rounded-2xl transition-transform active:scale-95"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)' }}>
              <Radio size={20} style={{ color: 'var(--accent-purple)' }} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm font-syne" style={{ color: 'var(--text-primary)' }}>Vibe</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Listen together</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/music')}
            className="flex items-center gap-3 p-4 rounded-2xl transition-transform active:scale-95"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(20,184,166,0.15)' }}>
              <Music2 size={20} style={{ color: 'var(--accent-teal)' }} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm font-syne" style={{ color: 'var(--text-primary)' }}>Music</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Your library</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Songs */}
      {songs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between px-5 mb-3">
            <h2 className="font-bold text-base font-syne" style={{ color: 'var(--text-primary)' }}>
              Recent Tracks
            </h2>
            <button onClick={() => navigate('/music')} className="text-xs font-semibold"
              style={{ color: 'var(--accent-purple)' }}>
              See all
            </button>
          </div>

          <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-1">
            {songs.slice(0, 6).map((song, i) => (
              <button
                key={song.filename}
                onClick={() => playSong(song, songs)}
                className="shrink-0 w-36 rounded-2xl overflow-hidden transition-transform active:scale-95"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div className={`h-28 bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center`}>
                  {song.has_art ? (
                    <img src={`${API}/music/art/${encodeURIComponent(song.filename)}`}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <span className="text-4xl">🎵</span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold truncate font-syne" style={{ color: 'var(--text-primary)' }}>
                    {song.title}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                    {song.artist}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <div className="px-5 mb-6">
          <h2 className="font-bold text-base font-syne mb-3" style={{ color: 'var(--text-primary)' }}>
            Your Playlists
          </h2>
          <div className="space-y-2">
            {playlists.map((pl, i) => (
              <button
                key={pl.id}
                onClick={() => pl.songs?.length && playPlaylist(pl.songs)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl transition-transform active:scale-98"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center shrink-0`}>
                  <Music2 size={18} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm font-syne" style={{ color: 'var(--text-primary)' }}>{pl.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pl.songs?.length || 0} songs</p>
                </div>
                <Play size={16} style={{ color: 'var(--accent-purple)' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {songs.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: 'var(--bg-secondary)' }}>
            <Music2 size={36} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <h3 className="font-bold text-lg font-syne mb-1" style={{ color: 'var(--text-primary)' }}>
            No music yet
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Drop .mp3 files in <code className="text-xs px-1 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>backend/music/</code> to get started
          </p>
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}
