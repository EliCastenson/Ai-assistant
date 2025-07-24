import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'
import EmailPage from './pages/EmailPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import LoadingSpinner from './components/LoadingSpinner'
import NotFoundPage from './pages/NotFoundPage'
import QuickActionsToolbar from './components/QuickActionsToolbar'

function App() {
  const { user, loading } = useAuth()
  const [showQuickActions, setShowQuickActions] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  const handleQuickAction = (actionId: string) => {
    console.log('Quick action triggered:', actionId)
    // TODO: Implement action handlers
    switch (actionId) {
      case 'voice-input':
        // Trigger voice input in chat
        break
      case 'file-search':
        // Open file search modal
        break
      case 'create-task':
        // Navigate to tasks page
        break
      default:
        console.log('Action not implemented:', actionId)
    }
  }

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
      
      {/* Quick Actions Toolbar */}
      <QuickActionsToolbar 
        isVisible={showQuickActions}
        onAction={handleQuickAction}
      />
      
      {/* Toggle Button */}
      <button
        onClick={() => setShowQuickActions(!showQuickActions)}
        className="fixed bottom-6 left-6 z-40 bg-primary-600 text-white rounded-full p-3 shadow-lg hover:bg-primary-700 transition-colors"
        title="Toggle Quick Actions"
      >
        <span className="text-xl">⚡</span>
      </button>
    </>
  )
}

export default App 