import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDarkMode } from '../hooks/useDarkMode'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isDark, toggleDark } = useDarkMode()

  const navItems = [
    { path: '/chat', label: 'Chat', icon: '💬', description: 'AI-powered conversations' },
    { path: '/tasks', label: 'Tasks', icon: '📋', description: 'Manage your tasks' },
    { path: '/calendar', label: 'Calendar', icon: '📅', description: 'Schedule and events' },
    { path: '/email', label: 'Email', icon: '📧', description: 'Email automation' },
    { path: '/settings', label: 'Settings', icon: '⚙️', description: 'Preferences & integrations' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  AI Assistant
                </h1>
              </div>
            </div>

            {/* User menu + Dark mode toggle */}
            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  // Moon icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                  </svg>
                ) : (
                  // Sun icon
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95l-1.41-1.41M6.46 6.46L5.05 5.05m12.02 0l-1.41 1.41M6.46 17.54l-1.41 1.41" />
                  </svg>
                )}
              </button>
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-medium text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={logout} 
                className="btn btn-ghost btn-sm"
                title="Logout"
              >
                <span className="sr-only sm:not-sr-only">Logout</span>
                <svg className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-lg border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Sidebar header */}
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>
              </div>
            </div>

            {/* Navigation items */}
            <div className="flex-1 p-4">
              <ul className="space-y-2">
                {navItems.map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden
                        ${location.pathname === item.path
                          ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-200 shadow-sm border border-primary-200 dark:border-primary-800'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-sm'
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {location.pathname === item.path && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r-full"></div>
                      )}
                      
                      <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                        {item.icon}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium dark:text-gray-100">{item.label}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                      </div>
                      
                      {/* Hover effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
              <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 rounded-lg p-3">
                <p className="text-xs text-primary-700 dark:text-primary-200 font-medium">AI Assistant v1.0</p>
                <p className="text-xs text-primary-600 dark:text-primary-300 mt-1">Powered by GPT-4</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 min-h-screen bg-white dark:bg-zinc-900">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout 