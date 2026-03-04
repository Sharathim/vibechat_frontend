import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { usePlayer } from '../context/PlayerContext'
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Radio } from 'lucide-react'
import { Avatar } from './HomePage'

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`

function formatCallTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export default function CallPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  const isIncoming = searchParams.get('incoming') === '1'

  const { user, token } = useAuth()
  const { emit, on, off } = useSocket()
  const { currentSong, isPlaying: musicPlaying } = usePlayer()

  const [otherUser, setOtherUser] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [callVol, setCallVol] = useState(0.8)
  const [musicVol, setMusicVol] = useState(0.8)
  const [connected, setConnected] = useState(false)

  const timerRef = useRef(null)
  const peerRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteAudioRef = useRef(new Audio())

  useEffect(() => {
    loadOtherUser()
    setupWebRTC()
    setupSocketListeners()

    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000)

    return () => {
      clearInterval(timerRef.current)
      off('webrtc_offer', handleOffer)
      off('webrtc_answer', handleAnswer)
      off('webrtc_ice', handleIce)
      off('call_ended_signal', handleCallEnded)
      cleanup()
    }
  }, [userId])

  const loadOtherUser = async () => {
    try {
      const res = await fetch(`${API}/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setOtherUser(await res.json())
    } catch {}
  }

  const setupSocketListeners = () => {
    on('webrtc_offer', handleOffer)
    on('webrtc_answer', handleAnswer)
    on('webrtc_ice', handleIce)
    on('call_ended_signal', handleCallEnded)
  }

  const setupWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      peerRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.ontrack = (event) => {
        const audio = remoteAudioRef.current
        audio.srcObject = event.streams[0]
        audio.volume = callVol
        audio.play().catch(() => {})
        setConnected(true)
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emit('webrtc_ice', { to: userId, candidate: event.candidate, from: user.id })
        }
      }

      // If not incoming, create offer
      if (!isIncoming) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        emit('webrtc_offer', { to: userId, offer, from: user.id })
      }
    } catch (err) {
      console.error('WebRTC setup error:', err)
    }
  }

  const handleOffer = async ({ offer, from }) => {
    if (!peerRef.current) return
    try {
      await peerRef.current.setRemoteDescription(offer)
      const answer = await peerRef.current.createAnswer()
      await peerRef.current.setLocalDescription(answer)
      emit('webrtc_answer', { to: from, answer, from: user.id })
    } catch (err) {
      console.error('Handle offer error:', err)
    }
  }

  const handleAnswer = async ({ answer }) => {
    try {
      await peerRef.current?.setRemoteDescription(answer)
      setConnected(true)
    } catch (err) {
      console.error('Handle answer error:', err)
    }
  }

  const handleIce = async ({ candidate }) => {
    try {
      await peerRef.current?.addIceCandidate(candidate)
    } catch {}
  }

  const handleCallEnded = ({ duration }) => {
    cleanup()
    navigate(-1)
  }

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    peerRef.current?.close()
    remoteAudioRef.current.srcObject = null
  }

  const endCall = () => {
    emit('call_end', { to: userId, session_id: sessionId, duration: callDuration })
    cleanup()
    navigate(-1)
  }

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted })
    setMuted(m => !m)
  }

  const toggleSpeaker = () => {
    remoteAudioRef.current.muted = speakerOn
    setSpeakerOn(s => !s)
  }

  const handleCallVol = (v) => {
    setCallVol(v)
    remoteAudioRef.current.volume = v
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ background: '#0A0A0F' }}>
      {/* Blurred bg */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 to-black/90" />
        {/* Pulse rings */}
        {connected && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {[1, 2, 3].map(i => (
              <div key={i} className="absolute inset-0 rounded-full border border-purple-500/20 pulse-ring"
                style={{ width: `${100 + i * 60}px`, height: `${100 + i * 60}px`, animationDelay: `${i * 0.4}s`, transform: 'translate(-50%, -50%)' }} />
            ))}
          </div>
        )}
      </div>

      <div className="relative flex flex-col h-full items-center justify-between px-8 pt-16 pb-10 z-10">
        {/* Status */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest font-semibold mb-1"
            style={{ color: connected ? '#22C55E' : 'var(--text-secondary)' }}>
            {connected ? 'Connected' : 'Connecting...'}
          </p>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 mb-4">
            <Avatar user={otherUser} size={28} />
          </div>
          <h2 className="text-2xl font-bold font-syne mb-1" style={{ color: 'var(--text-primary)' }}>
            {otherUser?.name || 'Calling...'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {connected ? formatCallTime(callDuration) : 'Ringing...'}
          </p>
        </div>

        {/* Volume controls */}
        <div className="w-full rounded-2xl p-4" style={{ background: 'rgba(17,17,24,0.8)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm">📞</span>
            <span className="text-xs w-14 shrink-0 font-semibold" style={{ color: 'var(--text-secondary)' }}>Call</span>
            <input type="range" min={0} max={1} step={0.01} value={callVol}
              onChange={e => handleCallVol(parseFloat(e.target.value))}
              className="flex-1" style={{ accentColor: 'var(--accent-teal)' }} />
          </div>
          {musicPlaying && (
            <div className="flex items-center gap-3">
              <span className="text-sm">🎵</span>
              <span className="text-xs w-14 shrink-0 font-semibold" style={{ color: 'var(--text-secondary)' }}>Music</span>
              <input type="range" min={0} max={1} step={0.01} value={musicVol}
                onChange={e => { setMusicVol(e.target.value) }}
                className="flex-1" style={{ accentColor: 'var(--accent-purple)' }} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button onClick={toggleMute}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: muted ? 'rgba(239,68,68,0.2)' : 'var(--bg-tertiary)' }}>
            {muted
              ? <MicOff size={22} style={{ color: '#EF4444' }} />
              : <Mic size={22} style={{ color: 'var(--text-primary)' }} />
            }
          </button>

          <button onClick={endCall}
            className="w-18 h-18 w-[72px] h-[72px] rounded-full flex items-center justify-center"
            style={{ background: '#EF4444' }}>
            <PhoneOff size={28} className="text-white" />
          </button>

          <button onClick={toggleSpeaker}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: !speakerOn ? 'rgba(239,68,68,0.2)' : 'var(--bg-tertiary)' }}>
            {speakerOn
              ? <Volume2 size={22} style={{ color: 'var(--text-primary)' }} />
              : <VolumeX size={22} style={{ color: '#EF4444' }} />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
