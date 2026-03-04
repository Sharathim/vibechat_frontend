import { createContext, useContext, useState, useRef, useEffect } from 'react'
import { Howl } from 'howler'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`
const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('none') // none | one | all
  const [expanded, setExpanded] = useState(false)
  const [likedSongs, setLikedSongs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vc_liked') || '[]') } catch { return [] }
  })

  const howlRef = useRef(null)
  const progressTimer = useRef(null)

  const stopProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
  }

  const startProgressTimer = () => {
    stopProgressTimer()
    progressTimer.current = setInterval(() => {
      if (howlRef.current) {
        const seek = howlRef.current.seek() || 0
        setProgress(seek)
      }
    }, 500)
  }

  const loadSong = (song, autoPlay = true) => {
    if (howlRef.current) {
      howlRef.current.unload()
    }
    stopProgressTimer()
    setProgress(0)
    setDuration(0)

    const url = `${API}/music/stream/${encodeURIComponent(song.filename)}`
    const howl = new Howl({
      src: [url],
      html5: true,
      volume: volume,
      onload: () => {
        setDuration(howl.duration())
      },
      onplay: () => {
        setIsPlaying(true)
        startProgressTimer()
      },
      onpause: () => {
        setIsPlaying(false)
        stopProgressTimer()
      },
      onstop: () => {
        setIsPlaying(false)
        stopProgressTimer()
        setProgress(0)
      },
      onend: () => {
        stopProgressTimer()
        handleSongEnd()
      },
      onloaderror: (id, err) => {
        console.error('Load error', err)
      }
    })

    howlRef.current = howl
    setCurrentSong(song)

    if (autoPlay) {
      howl.play()
    }
  }

  const handleSongEnd = () => {
    if (repeat === 'one') {
      howlRef.current?.seek(0)
      howlRef.current?.play()
      return
    }
    if (queue.length > 0) {
      playNext()
    } else {
      setIsPlaying(false)
    }
  }

  const playSong = (song, newQueue = null) => {
    if (newQueue) {
      setQueue(newQueue)
      const idx = newQueue.findIndex(s => s.filename === song.filename)
      setQueueIndex(idx >= 0 ? idx : 0)
    }
    loadSong(song, true)
  }

  const playPlaylist = (songs, startIndex = 0) => {
    setQueue(songs)
    setQueueIndex(startIndex)
    loadSong(songs[startIndex], true)
  }

  const togglePlay = () => {
    if (!howlRef.current) return
    if (isPlaying) {
      howlRef.current.pause()
    } else {
      howlRef.current.play()
    }
  }

  const playNext = () => {
    if (queue.length === 0) return
    let nextIdx
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length)
    } else {
      nextIdx = (queueIndex + 1) % queue.length
    }
    if (repeat !== 'all' && nextIdx === 0 && !shuffle) return
    setQueueIndex(nextIdx)
    loadSong(queue[nextIdx], true)
  }

  const playPrev = () => {
    if (queue.length === 0) return
    if (progress > 3) {
      howlRef.current?.seek(0)
      return
    }
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length
    setQueueIndex(prevIdx)
    loadSong(queue[prevIdx], true)
  }

  const seek = (time) => {
    howlRef.current?.seek(time)
    setProgress(time)
  }

  const changeVolume = (v) => {
    setVolume(v)
    howlRef.current?.volume(v)
  }

  const toggleLike = (song) => {
    setLikedSongs(prev => {
      const exists = prev.find(s => s.filename === song.filename)
      const next = exists ? prev.filter(s => s.filename !== song.filename) : [...prev, song]
      localStorage.setItem('vc_liked', JSON.stringify(next))
      return next
    })
  }

  const isLiked = (song) => likedSongs.some(s => s.filename === song?.filename)

  // Expose howl for vibe sync
  const getHowl = () => howlRef.current

  return (
    <PlayerContext.Provider value={{
      currentSong, queue, isPlaying, progress, duration,
      volume, shuffle, repeat, expanded, likedSongs,
      playSong, playPlaylist, togglePlay, playNext, playPrev,
      seek, changeVolume, toggleLike, isLiked,
      setShuffle, setRepeat, setExpanded, setQueue,
      getHowl, loadSong, setIsPlaying
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
