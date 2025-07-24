import React, { useState, useEffect } from 'react'

interface Notification {
  id: string
  type: 'suggestion' | 'message' | 'task' | 'calendar' | 'email'
  title: string
  message: string
  read: boolean
  created_at: string
  action?: {
    type: string
    data?: any
  }
}

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Mock notifications for now
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'suggestion',
        title: 'New AI Suggestion',
        message: 'AI has a new suggestion for you based on your recent activity.',
        read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        action: { type: 'open_suggestions' }
      },
      {
        id: '2',
        type: 'task',
        title: 'Task Reminder',
        message: 'You have a task due in 2 hours: "Review project proposal"',
        read: false,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        action: { type: 'open_task', data: { taskId: '123' } }
      },
      {
        id: '3',
        type: 'calendar',
        title: 'Meeting Starting Soon',
        message: 'Team standup meeting starts in 10 minutes',
        read: true,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        action: { type: 'open_calendar', data: { eventId: '456' } }
      }
    ]
    setNotifications(mockNotifications)
  }, [])

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length)
  }, [notifications])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return '💡'
      case 'message': return '💬'
      case 'task': return '📋'
      case 'calendar': return '📅'
      case 'email': return '📧'
      default: return '🔔'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'suggestion': return 'bg-blue-100 text-blue-800'
      case 'message': return 'bg-green-100 text-green-800'
      case 'task': return 'bg-yellow-100 text-yellow-800'
      case 'calendar': return 'bg-purple-100 text-purple-800'
      case 'email': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
    
    // Call parent handler
    onNotificationClick?.(notification)
    
    // Close dropdown
    setIsOpen(false)
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-3 rounded-xl transition-all duration-300 group
          ${isOpen 
            ? 'bg-primary-100 text-primary-700 shadow-md' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }
        `}
        title="Notifications"
      >
        <span 
          role="img" 
          aria-label="notifications" 
          className={`text-xl transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-110'}`}
        >
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-error-500 to-error-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔔</span>
                </div>
                <p className="font-medium">No notifications</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0 mt-2 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-b-2xl">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-sm text-center text-gray-600 hover:text-gray-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default NotificationBell 