import { usePlayer } from '../context/PlayerContext'
import { Play, Pause, SkipForward, ChevronUp } from 'lucide-react'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

function SongArt({ song, size = 10 }) {
  const colors = ['from-purple-600 to-blue-600', 'from-teal-500 to-green-500', 'from-pink-600 to-rose-600', 'from-orange-500 to-amber-500']
  const colorIdx = song?.filename ? song.filename.charCodeAt(0) % colors.length : 0

  if (song?.has_art) {
    return (
      <img
        src={`${API}/music/art/${encodeURIComponent(song.filename)}`}
        alt={song.title}
        className={`w-${size} h-${size} rounded-lg object-cover`}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }

  return (
    <div className={`w-${size} h-${size} rounded-lg bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center text-white text-xs font-bold font-syne shrink-0`}>
      {song?.title?.[0] || '♪'}
    </div>
  )
}

export { SongArt }

export default function MiniPlayer() {
  const { currentSong, isPlaying, progress, duration, togglePlay, playNext, setExpanded } = usePlayer()

  if (!currentSong) return null

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div
      className="shrink-0 h-16 glass border-t cursor-pointer relative overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-purple-600 to-teal-500 transition-all duration-500"
        style={{ width: `${pct}%` }} />

      <div className="flex items-center h-full px-3 gap-3" onClick={() => setExpanded(true)}>
        <SongArt song={currentSong} size={10} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate font-syne" style={{ color: 'var(--text-primary)' }}>
            {currentSong.title}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            {currentSong.artist}
          </p>
        </div>

        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--accent-purple)' }}
          >
            {isPlaying
              ? <Pause size={16} fill="white" color="white" />
              : <Play size={16} fill="white" color="white" className="ml-0.5" />
            }
          </button>
          <button
            onClick={playNext}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            <SkipForward size={18} />
          </button>
        </div>

        <button
          onClick={() => setExpanded(true)}
          className="w-7 h-7 flex items-center justify-center"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronUp size={16} />
        </button>
      </div>
    </div>
  )
}
