import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { Music2, Heart, Play, Plus, ListMusic, Search } from 'lucide-react'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

function formatDuration(s) {
  if (!s) return '--:--'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const gradients = [
  'from-purple-700 to-indigo-700',
  'from-teal-600 to-cyan-600',
  'from-pink-600 to-rose-600',
  'from-orange-600 to-amber-600',
  'from-blue-600 to-violet-600',
  'from-emerald-600 to-teal-600',
]

function SongRow({ song, index, onPlay, isPlaying }) {
  const gi = song.filename?.charCodeAt(0) % gradients.length || 0
  return (
    <button
      onClick={onPlay}
      className="w-full flex items-center gap-3 px-5 py-3 transition-colors active:opacity-70"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br ${gradients[gi]} flex items-center justify-center`}>
        {song.has_art ? (
          <img src={`${API}/music/art/${encodeURIComponent(song.filename)}`}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <span className="text-lg">🎵</span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-semibold truncate font-syne ${isPlaying ? 'text-purple-400' : ''}`}
          style={{ color: isPlaying ? 'var(--accent-purple)' : 'var(--text-primary)' }}>
          {song.title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
          {song.artist}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {formatDuration(song.duration)}
        </span>
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-0.5 rounded-full bg-purple-500 eq-bar"
                style={{ '--duration': `${0.6 + i * 0.2}s`, height: '100%' }} />
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

export default function MusicPage() {
  const { token } = useAuth()
  const { playSong, playPlaylist, currentSong, isPlaying, likedSongs } = usePlayer()
  const [tab, setTab] = useState('browse')
  const [songs, setSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')

  useEffect(() => {
    loadMusic()
  }, [token])

  const loadMusic = async () => {
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

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return
    try {
      const res = await fetch(`${API}/music/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newPlaylistName, songs: [] })
      })
      if (res.ok) {
        const pl = await res.json()
        setPlaylists(prev => [...prev, pl])
        setNewPlaylistName('')
        setShowCreatePlaylist(false)
      }
    } catch {}
  }

  const filteredSongs = songs.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.artist.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-3">
        <h1 className="text-2xl font-extrabold font-syne mb-4" style={{ color: 'var(--text-primary)' }}>
          Music
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-4" style={{ background: 'var(--bg-tertiary)' }}>
          {['browse', 'library'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold font-syne capitalize transition-all"
              style={{
                background: tab === t ? 'var(--accent-purple)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-secondary)'
              }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'browse' && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: 'var(--bg-tertiary)' }}>
            <Search size={15} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search songs, artists..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : tab === 'browse' ? (
          filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full pb-20">
              <Music2 size={48} className="mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {search ? 'No songs found' : 'Drop .mp3 files in backend/music/'}
              </p>
            </div>
          ) : (
            <div>
              {songs.length > 0 && (
                <button
                  onClick={() => playPlaylist(songs)}
                  className="mx-5 mb-3 w-[calc(100%-40px)] py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: 'var(--accent-purple)' }}>
                  <Play size={16} fill="white" /> Play All ({songs.length})
                </button>
              )}
              {filteredSongs.map((song, i) => (
                <SongRow
                  key={song.filename}
                  song={song}
                  index={i}
                  onPlay={() => playSong(song, songs)}
                  isPlaying={currentSong?.filename === song.filename && isPlaying}
                />
              ))}
              <div className="h-4" />
            </div>
          )
        ) : (
          /* Library tab */
          <div className="px-5">
            {/* Liked songs */}
            {likedSongs.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-sm font-syne mb-3" style={{ color: 'var(--text-secondary)' }}>
                  LIKED SONGS
                </h3>
                <button
                  onClick={() => playPlaylist(likedSongs)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl mb-2 transition-transform active:scale-98"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                    <Heart size={20} className="text-white" fill="white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm font-syne" style={{ color: 'var(--text-primary)' }}>Liked Songs</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{likedSongs.length} songs</p>
                  </div>
                  <Play size={16} className="ml-auto" style={{ color: 'var(--accent-purple)' }} />
                </button>
              </div>
            )}

            {/* Playlists */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm font-syne uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Playlists
              </h3>
              <button onClick={() => setShowCreatePlaylist(true)}
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--accent-purple)' }}>
                <Plus size={14} /> New
              </button>
            </div>

            {showCreatePlaylist && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Playlist name..."
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                  autoFocus
                />
                <button onClick={createPlaylist}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'var(--accent-purple)' }}>
                  Create
                </button>
              </div>
            )}

            {playlists.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <ListMusic size={40} className="mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No playlists yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map((pl, i) => (
                  <button key={pl.id}
                    onClick={() => pl.songs?.length && playPlaylist(pl.songs)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl transition-transform active:scale-98"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center shrink-0`}>
                      <ListMusic size={18} className="text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-bold text-sm font-syne truncate" style={{ color: 'var(--text-primary)' }}>{pl.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pl.songs?.length || 0} songs</p>
                    </div>
                    <Play size={16} style={{ color: 'var(--accent-purple)' }} />
                  </button>
                ))}
              </div>
            )}
            <div className="h-4" />
          </div>
        )}
      </div>
    </div>
  )
}
