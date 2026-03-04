import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { usePlayer } from '../context/PlayerContext'
import { Howl } from 'howler'
import { ArrowLeft, Play, Pause, SkipForward, Volume2, Phone, Smile, Radio } from 'lucide-react'
import { Avatar } from './HomePage'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`
const REACTIONS = ['🔥', '❤️', '🎵', '💜', '🌊', '✨', '🎉', '😍']

function EqBars({ playing }) {
  if (!playing) return <div className="w-8 h-5 flex items-center justify-center opacity-30"><span className="text-lg">🎵</span></div>
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[1, 2, 3, 4].map(i => (
        <div key={i}
          className="w-1 rounded-full bg-gradient-to-t from-purple-600 to-teal-400 eq-bar"
          style={{ '--duration': `${0.5 + i * 0.15}s`, height: '100%' }} />
      ))}
    </div>
  )
}

export default function VibePage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token } = useAuth()
  const { emit, on, off } = useSocket()
  const { getHowl, setIsPlaying: setPlayerPlaying } = usePlayer()

  const [session, setSession] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [musicVol, setMusicVol] = useState(0.8)
  const [callVol, setCallVol] = useState(0.8)
  const [reactions, setReactions] = useState([])
  const [showReactions, setShowReactions] = useState(false)
  const [otherUser, setOtherUser] = useState(null)
  const [songData, setSongData] = useState(null)

  const vibeHowlRef = useRef(null)
  const reactionsRef = useRef(0)

  useEffect(() => {
    // Join the vibe room
    emit('vibe_join_room', { session_id: sessionId })

    on('vibe_start', handleVibeStart)
    on('vibe_paused', handlePaused)
    on('vibe_resumed', handleResumed)
    on('vibe_skipped', handleSkipped)
    on('vibe_ended', handleEnded)
    on('vibe_reaction', handleReaction)

    return () => {
      off('vibe_start', handleVibeStart)
      off('vibe_paused', handlePaused)
      off('vibe_resumed', handleResumed)
      off('vibe_skipped', handleSkipped)
      off('vibe_ended', handleEnded)
      off('vibe_reaction', handleReaction)
      vibeHowlRef.current?.unload()
    }
  }, [sessionId])

  const handleVibeStart = (data) => {
    setSession(data)
    setSongData(data.song)
    startSync(data)

    // Load other user info
    const otherId = data.host === user.id ? data.guest : data.host
    if (otherId) {
      fetch(`${API}/users/${otherId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(u => u && setOtherUser(u))
    }
  }

  const startSync = (data) => {
    if (!data.song) return
    vibeHowlRef.current?.unload()

    const url = `${API}/music/stream/${encodeURIComponent(data.song.filename)}`
    const howl = new Howl({
      src: [url],
      html5: true,
      volume: musicVol,
      onload: () => {
        const seekTo = Math.max(0, (Date.now() - data.start_timestamp) / 1000 - 0.3)
        howl.seek(seekTo)
        howl.play()
        setIsPlaying(true)
      },
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
    })
    vibeHowlRef.current = howl
  }

  const handlePaused = ({ timestamp }) => {
    vibeHowlRef.current?.pause()
    setIsPlaying(false)
  }

  const handleResumed = ({ timestamp }) => {
    vibeHowlRef.current?.play()
    setIsPlaying(true)
  }

  const handleSkipped = (data) => {
    setSongData(data.next_song)
    startSync({ song: data.next_song, start_timestamp: data.start_timestamp })
  }

  const handleEnded = () => {
    vibeHowlRef.current?.unload()
    navigate(-1)
  }

  const handleReaction = ({ emoji, from }) => {
    const id = ++reactionsRef.current
    setReactions(prev => [...prev, { id, emoji }])
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2500)
  }

  const togglePlayPause = () => {
    if (!session) return
    const isHost = session.host === user.id
    if (!isHost) return

    if (isPlaying) {
      emit('vibe_pause', { session_id: sessionId, timestamp: vibeHowlRef.current?.seek() || 0 })
      vibeHowlRef.current?.pause()
    } else {
      emit('vibe_resume', { session_id: sessionId })
      vibeHowlRef.current?.play()
    }
  }

  const sendReaction = (emoji) => {
    emit('vibe_reaction', { session_id: sessionId, emoji })
    handleReaction({ emoji, from: user.id })
    setShowReactions(false)
  }

  const endVibe = () => {
    emit('vibe_end', { session_id: sessionId })
    vibeHowlRef.current?.unload()
    navigate(-1)
  }

  const handleMusicVol = (v) => {
    setMusicVol(v)
    vibeHowlRef.current?.volume(v)
  }

  const isHost = session?.host === user.id
  const gradients = ['from-purple-900 via-indigo-900 to-black', 'from-teal-900 via-cyan-900 to-black']

  return (
    <div className="flex flex-col h-full relative overflow-hidden"
      style={{ background: '#0A0A0F' }}>
      {/* Animated bg */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-transparent" />
        {isPlaying && (
          <>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 animate-pulse-slow"
              style={{ background: 'radial-gradient(circle, var(--accent-purple), transparent)' }} />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 animate-pulse-slow"
              style={{ background: 'radial-gradient(circle, var(--accent-teal), transparent)', animationDelay: '1s' }} />
          </>
        )}
      </div>

      {/* Floating reactions */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {reactions.map(r => (
          <div key={r.id} className="absolute bottom-32 floating-emoji text-3xl"
            style={{ left: `${20 + Math.random() * 60}%` }}>
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative flex flex-col h-full px-5 pt-10 pb-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-semibold font-syne uppercase tracking-widest text-purple-400">
              Vibe Live
            </span>
          </div>
          <button onClick={endVibe} className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
            End
          </button>
        </div>

        {/* Participants */}
        <div className="flex justify-center gap-8 mb-6">
          {[user, otherUser].map((u, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className={`w-14 h-14 rounded-full ${isPlaying ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : ''}`}>
                  <Avatar user={u} size={14} />
                </div>
                {isPlaying && (
                  <div className="absolute inset-0 rounded-full pulse-ring border-2 border-purple-500" />
                )}
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {u?.name?.split(' ')[0] || '...'}
              </span>
            </div>
          ))}
        </div>

        {/* Album art */}
        <div className="flex justify-center mb-6">
          <div className="w-52 h-52 rounded-3xl overflow-hidden shadow-2xl purple-glow bg-gradient-to-br from-purple-700 to-indigo-900 flex items-center justify-center">
            {songData?.has_art ? (
              <img src={`${API}/music/art/${encodeURIComponent(songData.filename)}`}
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <span className="text-7xl">🎵</span>
            )}
          </div>
        </div>

        {/* Song info + EQ */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-1">
            <h2 className="text-lg font-bold font-syne" style={{ color: 'var(--text-primary)' }}>
              {songData?.title || 'Loading...'}
            </h2>
            <EqBars playing={isPlaying} />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {songData?.artist || ''}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={togglePlayPause}
            disabled={!isHost}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50"
            style={{ background: 'var(--accent-purple)', boxShadow: '0 0 30px var(--accent-glow)' }}>
            {isPlaying
              ? <Pause size={26} fill="white" color="white" />
              : <Play size={26} fill="white" color="white" className="ml-1" />
            }
          </button>
          {!isHost && (
            <p className="text-xs absolute bottom-48" style={{ color: 'var(--text-secondary)' }}>
              Host controls playback
            </p>
          )}
        </div>

        {/* Volume controls */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm">🎵</span>
            <span className="text-xs font-semibold w-20 shrink-0" style={{ color: 'var(--text-secondary)' }}>Music</span>
            <input type="range" min={0} max={1} step={0.01} value={musicVol}
              onChange={e => handleMusicVol(parseFloat(e.target.value))}
              className="flex-1" style={{ accentColor: 'var(--accent-purple)' }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">📞</span>
            <span className="text-xs font-semibold w-20 shrink-0" style={{ color: 'var(--text-secondary)' }}>Call</span>
            <input type="range" min={0} max={1} step={0.01} value={callVol}
              onChange={e => setCallVol(parseFloat(e.target.value))}
              className="flex-1" style={{ accentColor: 'var(--accent-teal)' }} />
          </div>
        </div>

        {/* Reaction button */}
        <div className="relative">
          <button onClick={() => setShowReactions(!showReactions)}
            className="w-full py-3 rounded-full flex items-center justify-center gap-2 text-sm font-semibold"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
            <Smile size={16} /> React
          </button>

          {showReactions && (
            <div className="absolute bottom-full mb-2 left-0 right-0 flex justify-center gap-2 flex-wrap p-3 rounded-2xl modal-enter"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              {REACTIONS.map(emoji => (
                <button key={emoji} onClick={() => sendReaction(emoji)}
                  className="text-2xl transition-transform active:scale-75 hover:scale-110">
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
