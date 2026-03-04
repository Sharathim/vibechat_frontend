import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, Edit2, MessageCircle } from 'lucide-react'
import { Avatar } from './HomePage'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

function timeAgo(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function lastMsgPreview(msg) {
  if (!msg) return 'No messages yet'
  if (msg.type === 'text') return msg.content
  if (msg.type === 'playlist_card') return '🎵 Shared a playlist'
  if (msg.type === 'vibe_invite') return '🎵 Vibe request'
  if (msg.type === 'call_ended') return '📞 Call ended'
  return msg.content || ''
}

export default function ChatsPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [token])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setConversations(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) setSearchResults(await res.json())
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, token])

  const displayList = searchQuery ? searchResults.map(u => ({ user: u, last_message: null, unread: 0 })) : conversations

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold font-syne" style={{ color: 'var(--text-primary)' }}>
            Messages
          </h1>
          <button className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            <Edit2 size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: 'var(--bg-tertiary)' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full pb-20">
            <MessageCircle size={48} className="mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery ? 'No users found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Search for someone to start chatting
              </p>
            )}
          </div>
        ) : (
          <div>
            {displayList.map(({ user: u, last_message, unread }) => (
              <button
                key={u.id}
                onClick={() => navigate(`/chats/${u.id}`)}
                className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors active:opacity-70"
                style={{ borderBottom: `1px solid var(--border)` }}
              >
                <div className="relative shrink-0">
                  <Avatar user={u} size={12} />
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 bg-green-500"
                    style={{ borderColor: 'var(--bg-primary)' }} />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm font-syne" style={{ color: 'var(--text-primary)' }}>
                      {u.name}
                    </span>
                    {last_message && (
                      <span className="text-[10px] shrink-0 ml-2" style={{ color: 'var(--text-secondary)' }}>
                        {timeAgo(last_message.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    @{u.username}
                    {last_message && ` · ${lastMsgPreview(last_message)}`}
                  </p>
                </div>

                {unread > 0 && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: 'var(--accent-purple)' }}>
                    {unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
