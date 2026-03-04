import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user, token } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [vibeIncoming, setVibeIncoming] = useState(null)
  const [callIncoming, setCallIncoming] = useState(null)

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setConnected(false)
      }
      return
    }

    // const socket = io('http://localhost:5000', {
    //   transports: ['websocket', 'polling']
    // })
    
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling']
})

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('register_user', { user_id: user.id })
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('vibe_incoming', (data) => {
      setVibeIncoming(data)
    })

    socket.on('call_incoming', (data) => {
      setCallIncoming(data)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [user?.id, token])

  const emit = (event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, { ...data, token })
    }
  }

  const on = (event, handler) => {
    socketRef.current?.on(event, handler)
  }

  const off = (event, handler) => {
    socketRef.current?.off(event, handler)
  }

  const joinRoom = (room) => {
    socketRef.current?.emit('join_chat', { room })
  }

  const dismissVibeIncoming = () => setVibeIncoming(null)
  const dismissCallIncoming = () => setCallIncoming(null)

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, connected, emit, on, off, joinRoom,
      vibeIncoming, callIncoming, dismissVibeIncoming, dismissCallIncoming
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
