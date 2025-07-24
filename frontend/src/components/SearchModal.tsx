import React, { useState, useEffect, useRef } from 'react'

interface SearchResult {
  id: string
  type: 'file' | 'app' | 'web' | 'ai'
  title: string
  description: string
  icon: string
  action: string
  metadata?: Record<string, any>
  relevance: number
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
  searchType?: 'file' | 'app' | 'web' | 'ai' | 'all'
}

const SearchModal: React.FC<SearchModalProps> = ({ 
  isOpen, 
  onClose, 
  initialQuery = '', 
  searchType = 'all' 
}) => {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(searchType)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: 'all', label: 'All', icon: '🔍' },
    { id: 'file', label: 'Files', icon: '📁' },
    { id: 'app', label: 'Apps', icon: '🚀' },
    { id: 'web', label: 'Web', icon: '🌐' },
    { id: 'ai', label: 'AI', icon: '🤖' }
  ]

  // Mock search results
  const mockSearch = async (searchQuery: string, type: string) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay

    const mockResults: SearchResult[] = []
    
    if (type === 'all' || type === 'file') {
      mockResults.push(
        {
          id: 'file1',
          type: 'file',
          title: 'project_proposal.docx',
          description: 'Documents/Work/Project proposal for Q4',
          icon: '📄',
          action: 'Open file',
          relevance: 0.9
        },
        {
          id: 'file2',
          type: 'file',
          title: 'meeting_notes.txt',
          description: 'Documents/Meetings/Team standup notes',
          icon: '📝',
          action: 'Open file',
          relevance: 0.7
        }
      )
    }

    if (type === 'all' || type === 'app') {
      mockResults.push(
        {
          id: 'app1',
          type: 'app',
          title: 'Visual Studio Code',
          description: 'Code editor',
          icon: '💻',
          action: 'Launch app',
          relevance: 0.8
        },
        {
          id: 'app2',
          type: 'app',
          title: 'Slack',
          description: 'Team communication',
          icon: '💬',
          action: 'Launch app',
          relevance: 0.6
        }
      )
    }

    if (type === 'all' || type === 'web') {
      mockResults.push(
        {
          id: 'web1',
          type: 'web',
          title: 'Search for "' + searchQuery + '"',
          description: 'Search the web for this query',
          icon: '🌐',
          action: 'Search web',
          relevance: 0.9
        }
      )
    }

    if (type === 'all' || type === 'ai') {
      mockResults.push(
        {
          id: 'ai1',
          type: 'ai',
          title: 'AI Analysis',
          description: 'Get AI insights about "' + searchQuery + '"',
          icon: '🤖',
          action: 'Ask AI',
          relevance: 0.8
        }
      )
    }

    // Filter by query if provided
    const filteredResults = searchQuery 
      ? mockResults.filter(result => 
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : mockResults

    setResults(filteredResults.sort((a, b) => b.relevance - a.relevance))
    setLoading(false)
  }

  // Search when query or tab changes
  useEffect(() => {
    if (isOpen && query) {
      mockSearch(query, activeTab)
    } else if (isOpen) {
      setResults([])
    }
  }, [query, activeTab, isOpen])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const handleResultClick = (result: SearchResult) => {
    console.log('Search result clicked:', result)
    // TODO: Implement actual actions
    switch (result.type) {
      case 'file':
        console.log('Opening file:', result.title)
        break
      case 'app':
        console.log('Launching app:', result.title)
        break
      case 'web':
        console.log('Searching web for:', query)
        break
      case 'ai':
        console.log('Asking AI about:', query)
        break
    }
    onClose()
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    setSelectedIndex(0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Search</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search files, apps, web, or ask AI..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex items-center justify-center p-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <p>{query ? 'No results found' : 'Start typing to search'}</p>
              {query && (
                <p className="text-sm mt-2">Try different keywords or search type</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    index === selectedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {result.action}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {result.description}
                      </p>
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
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchModal 