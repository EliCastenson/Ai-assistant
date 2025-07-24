import React, { useState, useEffect } from 'react'

interface Suggestion {
  id: string
  type: 'task' | 'calendar' | 'email' | 'search' | 'file'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  action?: string
  metadata?: Record<string, any>
  created_at: string
}

interface SuggestionsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ isOpen, onClose }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)

  // Mock suggestions for now - will be replaced with real API calls
  useEffect(() => {
    const mockSuggestions: Suggestion[] = [
      {
        id: '1',
        type: 'task',
        title: 'Schedule team meeting',
        description: 'Based on your recent emails, you might want to schedule a follow-up meeting with the development team.',
        priority: 'high',
        action: 'Create task',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'calendar',
        title: 'Block time for project review',
        description: 'You have several pending tasks that could benefit from a focused review session.',
        priority: 'medium',
        action: 'Add to calendar',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        type: 'email',
        title: 'Follow up on client proposal',
        description: 'It\'s been 3 days since you sent the proposal. Consider sending a follow-up email.',
        priority: 'medium',
        action: 'Compose email',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        type: 'search',
        title: 'Research competitor pricing',
        description: 'Your recent conversation mentioned pricing strategy. This could help inform your decisions.',
        priority: 'low',
        action: 'Search web',
        created_at: new Date().toISOString()
      }
    ]
    setSuggestions(mockSuggestions)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '📋'
      case 'calendar': return '📅'
      case 'email': return '📧'
      case 'search': return '🔍'
      case 'file': return '📁'
      default: return '💡'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-green-500 bg-green-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const handleSuggestionAction = async (suggestion: Suggestion) => {
    setLoading(true)
    try {
      // TODO: Implement actual actions based on suggestion type
      console.log('Executing suggestion:', suggestion)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove the suggestion after action
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
    } catch (error) {
      console.error('Error executing suggestion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">AI Suggestions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Processing...</span>
            </div>
          )}

          {suggestions.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🤖</div>
              <p>No suggestions at the moment</p>
              <p className="text-sm">AI will generate suggestions based on your activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className={`border-l-4 p-4 rounded-lg ${getPriorityColor(suggestion.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{suggestion.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {suggestion.priority} priority
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(suggestion.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {suggestion.action && (
                        <button
                          onClick={() => handleSuggestionAction(suggestion)}
                          disabled={loading}
                          className="btn btn-primary text-sm px-3 py-1"
                        >
                          {suggestion.action}
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(suggestion.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => setSuggestions([])}
              className="text-primary-600 hover:text-primary-700 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuggestionsPanel 