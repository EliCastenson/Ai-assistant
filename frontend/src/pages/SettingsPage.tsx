import React from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

const SettingsPage = () => {
  const { isDark, toggleDark, resetToSystem } = useDarkMode()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Dark Mode</span>
          <button
            onClick={toggleDark}
            className={`btn ${isDark ? 'btn-primary' : 'btn-outline'}`}
          >
            {isDark ? 'On (Dark)' : 'Off (Light)'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Reset to system preference</span>
          <button
            onClick={resetToSystem}
            className="btn btn-secondary btn-sm"
          >
            Reset
          </button>
        </div>
        <div className="text-xs text-gray-400">Settings and integrations coming soon...</div>
      </div>
    </div>
  )
}

export default SettingsPage 