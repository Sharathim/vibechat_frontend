import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { usePlayer } from '../context/PlayerContext'
import MessageBubble from '../components/MessageBubble'
import { Avatar } from './HomePage'
import { ArrowLeft, Send, Music2, Radio, Phone, X } from 'lucide-react'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

export default function ChatRoomPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { emit, on, off, joinRoom } = useSocket()
  const { currentSong, playSong } = usePlayer()

  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [typing, setTyping] = useState(false)
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  const [songs, setSongs] = useState([])
  const [playlists, setPlaylists] = useState([])

  const bottomRef = useRef(null)
  const typingTimer = useRef(null)
  const room = useRef('')

  useEffect(() => {
    loadData()
    return () => {
      off('receive_message', handleReceive)
      off('user_typing', handleTyping)
      off('user_stop_typing', handleStopTyping)
    }
  }, [userId, token])

  const loadData = async () => {
    try {
      const [userRes, msgsRes, songsRes, plRes] = await Promise.all([
        fetch(`${API}/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/messages/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/music/songs`),
        fetch(`${API}/music/playlists`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (userRes.ok) setOtherUser(await userRes.json())
      if (msgsRes.ok) setMessages(await msgsRes.json())
      if (songsRes.ok) setSongs(await songsRes.json())
      if (plRes.ok) setPlaylists(await plRes.json())
    } catch {}
    setLoading(false)

    // Join socket room
    const participants = [user.id, userId].sort()
    room.current = `chat_${participants.join('_')}`
    joinRoom(room.current)

    on('receive_message', handleReceive)
    on('user_typing', handleTyping)
    on('user_stop_typing', handleStopTyping)
  }

  const handleReceive = (msg) => {
    setMessages(prev => {
      if (prev.find(m => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }

  const handleTyping = (data) => {
    if (data.from === userId) setTyping(true)
  }

  const handleStopTyping = (data) => {
    if (data.from === userId) setTyping(false)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = async (type = 'text', content = text, payload = {}) => {
    if (type === 'text' && !content.trim()) return
    const msg = {
      id: Date.now().toString(),
      from: user.id,
      to: userId,
      type,
      content,
      payload,
      timestamp: new Date().toISOString(),
      sender: { id: user.id, name: user.name, username: user.username, avatar: user.avatar }
    }
    setMessages(prev => [...prev, msg])
    emit('send_message', { to: userId, type, content, payload })

    if (type === 'text') {
      setText('')
      emit('stop_typing', { to: userId })
    }

    // Also persist
    try {
      await fetch(`${API}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to: userId, type, content, payload })
      })
    } catch {}
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    emit('typing', { to: userId })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => emit('stop_typing', { to: userId }), 2000)
  }

  const handleSendPlaylist = (pl) => {
    sendMessage('playlist_card', `Shared playlist: ${pl.name}`, pl)
    setShowMusicPicker(false)
  }

  const handleSendSong = (song) => {
    const pl = { name: song.title, owner_username: user.username, songs: [song], id: song.filename }
    sendMessage('playlist_card', `Shared: ${song.title}`, pl)
    setShowMusicPicker(false)
  }

  const handleVibeRequest = () => {
    if (!currentSong) return
    emit('vibe_request', { to: userId, song: currentSong })
    sendMessage('vibe_invite', `🎵 Vibe Request — ${currentSong.title}`, {
      song: currentSong,
      session_id: null // Will be set by server
    })
  }

  const handleCall = () => {
    const sessionId = Date.now().toString()
    emit('call_invite', { to: userId, session_id: sessionId })
    navigate(`/call/${userId}?session=${sessionId}`)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-3 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={22} />
        </button>

        {otherUser && (
          <>
            <div className="relative">
              <Avatar user={otherUser} size={10} />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 bg-green-500"
                style={{ borderColor: 'var(--bg-primary)' }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm font-syne" style={{ color: 'var(--text-primary)' }}>{otherUser.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>@{otherUser.username}</p>
            </div>
          </>
        )}

        <div className="flex gap-1">
          <button onClick={handleCall}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-teal)' }}>
            <Phone size={16} />
          </button>
          <button
            onClick={handleVibeRequest}
            disabled={!currentSong}
            className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-purple)' }}>
            <Radio size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
        {loading ? (
          <div className="flex justify-center pt-4">
            <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.from === user.id}
                otherUserId={userId}
                onVibeAccept={(sid) => {
                  emit('vibe_accept', { session_id: sid })
                  navigate(`/vibe/${sid}`)
                }}
                onVibeDecline={(sid) => emit('vibe_decline', { session_id: sid })}
              />
            ))}
            {typing && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1 px-3.5 py-2.5 rounded-2xl rounded-bl-sm"
                  style={{ background: 'var(--bg-secondary)' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'var(--text-secondary)', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Music picker sheet */}
      {showMusicPicker && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowMusicPicker(false)}>
          <div className="rounded-t-3xl p-5 max-h-[60%] overflow-y-auto no-scrollbar modal-enter"
            style={{ background: 'var(--bg-secondary)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base font-syne" style={{ color: 'var(--text-primary)' }}>
                Share Music
              </h3>
              <button onClick={() => setShowMusicPicker(false)}>
                <X size={18} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {playlists.length > 0 && (
              <>
                <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  Playlists
                </p>
                <div className="space-y-2 mb-4">
                  {playlists.map(pl => (
                    <button key={pl.id} onClick={() => handleSendPlaylist(pl)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl"
                      style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-700 to-teal-600 flex items-center justify-center shrink-0">
                        <Music2 size={16} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold font-syne" style={{ color: 'var(--text-primary)' }}>{pl.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pl.songs?.length || 0} songs</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Songs
            </p>
            <div className="space-y-2">
              {songs.map(song => (
                <button key={song.filename} onClick={() => handleSendSong(song)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl"
                  style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-lg">🎵</span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate font-syne" style={{ color: 'var(--text-primary)' }}>{song.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{song.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="shrink-0 px-4 py-3 border-t flex items-center gap-2"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)' }}>
        <button
          onClick={() => setShowMusicPicker(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-teal)' }}>
          <Music2 size={16} />
        </button>

        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Message..."
          className="flex-1 px-4 py-2.5 rounded-full text-sm outline-none"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)'
          }}
        />

        <button
          onClick={() => sendMessage()}
          disabled={!text.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          style={{ background: 'var(--accent-purple)' }}>
          <Send size={15} className="text-white ml-0.5" />
        </button>
      </div>
    </div>
  )
}
