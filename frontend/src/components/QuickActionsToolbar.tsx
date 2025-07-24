import React, { useState, useRef, useEffect } from 'react'

interface QuickAction {
  id: string
  label: string
  icon: string
  action: () => void
  shortcut?: string
  category: 'input' | 'search' | 'productivity' | 'ai'
}

interface QuickActionsToolbarProps {
  isVisible: boolean
  onAction?: (actionId: string) => void
}

const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({ isVisible, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('input')
  const toolbarRef = useRef<HTMLDivElement>(null)

  const quickActions: QuickAction[] = [
    // Input Actions
    {
      id: 'voice-input',
      label: 'Voice Input',
      icon: '🎤',
      category: 'input',
      action: () => {
        console.log('Voice input activated')
        onAction?.('voice-input')
      },
      shortcut: 'Ctrl+Shift+V'
    },
    {
      id: 'dictation',
      label: 'Dictation Mode',
      icon: '🗣️',
      category: 'input',
      action: () => {
        console.log('Dictation mode activated')
        onAction?.('dictation')
      }
    },
    
    // Search Actions
    {
      id: 'file-search',
      label: 'Find Files',
      icon: '📁',
      category: 'search',
      action: () => {
        console.log('File search activated')
        onAction?.('file-search')
      },
      shortcut: 'Ctrl+Shift+F'
    },
    {
      id: 'web-search',
      label: 'Web Search',
      icon: '🔍',
      category: 'search',
      action: () => {
        console.log('Web search activated')
        onAction?.('web-search')
      },
      shortcut: 'Ctrl+Shift+W'
    },
    {
      id: 'app-search',
      label: 'Open App',
      icon: '🚀',
      category: 'search',
      action: () => {
        console.log('App search activated')
        onAction?.('app-search')
      },
      shortcut: 'Ctrl+Shift+A'
    },
    
    // Productivity Actions
    {
      id: 'create-task',
      label: 'New Task',
      icon: '📋',
      category: 'productivity',
      action: () => {
        console.log('Create task activated')
        onAction?.('create-task')
      },
      shortcut: 'Ctrl+Shift+T'
    },
    {
      id: 'calendar-event',
      label: 'Add Event',
      icon: '📅',
      category: 'productivity',
      action: () => {
        console.log('Calendar event activated')
        onAction?.('calendar-event')
      },
      shortcut: 'Ctrl+Shift+C'
    },
    {
      id: 'send-email',
      label: 'Compose Email',
      icon: '📧',
      category: 'productivity',
      action: () => {
        console.log('Compose email activated')
        onAction?.('send-email')
      },
      shortcut: 'Ctrl+Shift+E'
    },
    
    // AI Actions
    {
      id: 'ai-summarize',
      label: 'Summarize',
      icon: '📝',
      category: 'ai',
      action: () => {
        console.log('AI summarize activated')
        onAction?.('ai-summarize')
      },
      shortcut: 'Ctrl+Shift+S'
    },
    {
      id: 'ai-translate',
      label: 'Translate',
      icon: '🌐',
      category: 'ai',
      action: () => {
        console.log('AI translate activated')
        onAction?.('ai-translate')
      },
      shortcut: 'Ctrl+Shift+L'
    },
    {
      id: 'ai-explain',
      label: 'Explain',
      icon: '🤔',
      category: 'ai',
      action: () => {
        console.log('AI explain activated')
        onAction?.('ai-explain')
      },
      shortcut: 'Ctrl+Shift+X'
    }
  ]

  const categories = [
    { id: 'input', label: 'Input', icon: '⌨️' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'productivity', label: 'Tasks', icon: '📋' },
    { id: 'ai', label: 'AI Tools', icon: '🤖' }
  ]

  const filteredActions = quickActions.filter(action => action.category === activeCategory)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return
      
      const action = quickActions.find(a => a.shortcut === `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key.toUpperCase()}`)
      if (action) {
        e.preventDefault()
        action.action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  // Auto-hide when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded])

  if (!isVisible) return null

  return (
    <div
      ref={toolbarRef}
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-16'
      }`}
    >
      {/* Main Toolbar */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Quick Actions</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {/* Category Tabs */}
        {isExpanded && (
          <div className="flex border-b border-gray-200">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-1 flex items-center justify-center p-2 text-xs font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        )}

        {/* Actions Grid */}
        {isExpanded ? (
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {filteredActions.map(action => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
                >
                  <span className="text-lg">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {action.label}
                    </div>
                    {action.shortcut && (
                      <div className="text-xs text-gray-400">
                        {action.shortcut}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Collapsed view - show category icons
          <div className="p-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id)
                  setIsExpanded(true)
                }}
                className="w-full p-2 rounded-lg hover:bg-gray-50 transition-colors mb-1"
                title={category.label}
              >
                <span className="text-lg">{category.icon}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="mt-3 flex justify-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl
            ${isExpanded 
              ? 'bg-gradient-to-r from-error-500 to-error-600 text-white hover:from-error-600 hover:to-error-700' 
              : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
            }
            hover:scale-110 hover:shadow-2xl active:scale-95
          `}
          title="Quick Actions"
        >
          <span className="text-2xl animate-pulse">{isExpanded ? '✕' : '⚡'}</span>
        </button>
      </div>
    </div>
  )
}

export default QuickActionsToolbar 