import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { PlayerProvider, usePlayer } from './context/PlayerContext'
import { SocketProvider } from './context/SocketContext'

import BottomNav from './components/BottomNav'
import MiniPlayer from './components/MiniPlayer'
import FullPlayer from './components/FullPlayer'
import VibeRequestModal from './components/VibeRequestModal'
import CallModal from './components/CallModal'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import HomePage from './pages/HomePage'
import ChatsPage from './pages/ChatsPage'
import ChatRoomPage from './pages/ChatRoomPage'
import MusicPage from './pages/MusicPage'
import VibePage from './pages/VibePage'
import CallPage from './pages/CallPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppLayout() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { expanded, currentSong } = usePlayer()
  const location = useLocation()

  const path = location.pathname
  const isAuth = path === '/login' || path === '/signup'
  const isFullscreen = path.startsWith('/vibe/') || path.startsWith('/call/')
  const hideChrome = isAuth || isFullscreen || !user

  return (
    <div className="app-shell" data-theme={theme}>
      <div className={`flex flex-col ${hideChrome ? 'h-full' : 'flex-1 min-h-0'} relative overflow-hidden`}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
            <Route path="/chats/:userId" element={<ProtectedRoute><ChatRoomPage /></ProtectedRoute>} />
            <Route path="/music" element={<ProtectedRoute><MusicPage /></ProtectedRoute>} />
            <Route path="/vibe/:sessionId" element={<ProtectedRoute><VibePage /></ProtectedRoute>} />
            <Route path="/call/:userId" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={user ? '/home' : '/login'} replace />} />
          </Routes>
        </div>
      </div>

      {!hideChrome && (
        <>
          {currentSong && <MiniPlayer />}
          <BottomNav />
        </>
      )}

      {expanded && !hideChrome && <FullPlayer />}

      {user && (
        <>
          <VibeRequestModal />
          <CallModal />
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PlayerProvider>
            <SocketProvider>
              <AppLayout />
            </SocketProvider>
          </PlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
