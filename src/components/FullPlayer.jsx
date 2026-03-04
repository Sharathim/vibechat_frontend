import { useState } from 'react'
import { usePlayer } from '../context/PlayerContext'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown, Heart, Shuffle, SkipBack, Play, Pause, SkipForward,
  Repeat, Repeat1, Volume2, Radio
} from 'lucide-react'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function FullPlayer() {
  const {
    currentSong, isPlaying, progress, duration, volume,
    shuffle, repeat, togglePlay, playNext, playPrev,
    seek, changeVolume, setShuffle, setRepeat, setExpanded,
    toggleLike, isLiked
  } = usePlayer()
  const navigate = useNavigate()

  const pct = duration > 0 ? (progress / duration) * 100 : 0
  const liked = isLiked(currentSong)

  const colors = ['from-purple-800 to-indigo-900', 'from-teal-800 to-green-900', 'from-pink-800 to-rose-900', 'from-orange-800 to-amber-900']
  const colorIdx = currentSong?.filename ? currentSong.filename.charCodeAt(0) % colors.length : 0

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    seek(pct * duration)
  }

  const cycleRepeat = () => {
    setRepeat(r => r === 'none' ? 'all' : r === 'all' ? 'one' : 'none')
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col fade-in"
      style={{ background: 'var(--bg-primary)' }}>
      {/* Blurred art background */}
      {currentSong?.has_art ? (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={`${API}/music/art/${encodeURIComponent(currentSong.filename)}`}
            alt=""
            className="w-full h-full object-cover scale-110 blur-2xl opacity-30"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,10,15,0.6), rgba(10,10,15,0.95))' }} />
        </div>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${colors[colorIdx]} opacity-20`} />
      )}

      {/* Content */}
      <div className="relative flex flex-col h-full px-6 pt-12 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setExpanded(false)} className="w-8 h-8 flex items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}>
            <ChevronDown size={24} />
          </button>
          <span className="text-xs font-semibold uppercase tracking-widest font-syne"
            style={{ color: 'var(--text-secondary)' }}>Now Playing</span>
          <button
            onClick={() => { setExpanded(false); navigate('/vibe/new') }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-purple)' }}
          >
            <Radio size={12} /> Vibe
          </button>
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center mb-8">
          {currentSong?.has_art ? (
            <img
              src={`${API}/music/art/${encodeURIComponent(currentSong.filename)}`}
              alt={currentSong.title}
              className="w-64 h-64 rounded-2xl object-cover shadow-2xl purple-glow"
            />
          ) : (
            <div className={`w-64 h-64 rounded-2xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center shadow-2xl purple-glow`}>
              <span className="text-7xl">🎵</span>
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold font-syne truncate" style={{ color: 'var(--text-primary)' }}>
              {currentSong?.title || 'Unknown'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {currentSong?.artist || 'Unknown Artist'}
            </p>
          </div>
          <button
            onClick={() => toggleLike(currentSong)}
            className="w-10 h-10 flex items-center justify-center transition-transform active:scale-75"
          >
            <Heart size={22} fill={liked ? '#7C3AED' : 'none'} color={liked ? '#7C3AED' : 'var(--text-secondary)'} />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div
            className="w-full h-1.5 rounded-full cursor-pointer relative"
            style={{ background: 'var(--bg-tertiary)' }}
            onClick={handleSeek}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-teal-500 transition-all duration-300 relative"
              style={{ width: `${pct}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow -translate-x-1/2" />
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{formatTime(progress)}</span>
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setShuffle(s => !s)} className="w-10 h-10 flex items-center justify-center transition-opacity"
            style={{ color: shuffle ? 'var(--accent-purple)' : 'var(--text-secondary)', opacity: shuffle ? 1 : 0.5 }}>
            <Shuffle size={20} />
          </button>

          <button onClick={playPrev} className="w-10 h-10 flex items-center justify-center"
            style={{ color: 'var(--text-primary)' }}>
            <SkipBack size={26} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90"
            style={{ background: 'var(--accent-purple)', boxShadow: '0 0 30px var(--accent-glow)' }}
          >
            {isPlaying
              ? <Pause size={26} fill="white" color="white" />
              : <Play size={26} fill="white" color="white" className="ml-1" />
            }
          </button>

          <button onClick={playNext} className="w-10 h-10 flex items-center justify-center"
            style={{ color: 'var(--text-primary)' }}>
            <SkipForward size={26} fill="currentColor" />
          </button>

          <button onClick={cycleRepeat} className="w-10 h-10 flex items-center justify-center transition-opacity"
            style={{ color: repeat !== 'none' ? 'var(--accent-purple)' : 'var(--text-secondary)', opacity: repeat === 'none' ? 0.5 : 1 }}>
            {repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3">
          <Volume2 size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="range" min={0} max={1} step={0.01}
            value={volume}
            onChange={e => changeVolume(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: 'var(--accent-purple)' }}
          />
        </div>
      </div>
    </div>
  )
}
