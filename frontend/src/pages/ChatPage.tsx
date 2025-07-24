import React, { useState, useRef, useEffect } from 'react'
import ChatThread from '../components/ChatThread'
import ChatInputBar from '../components/ChatInputBar'
import SuggestionsPanel from '../components/SuggestionsPanel'
import NotificationBell from '../components/NotificationBell'
import { FiPlus, FiZap, FiCheckSquare, FiCalendar, FiMail } from 'react-icons/fi'

const TABS = [
  { key: 'suggestions', label: 'Suggestions', icon: <FiZap />, color: 'bg-yellow-600', accent: 'from-yellow-700 to-yellow-900' },
  { key: 'tasks', label: 'Tasks', icon: <FiCheckSquare />, color: 'bg-red-600', accent: 'from-red-700 to-red-900' },
  { key: 'calendar', label: 'Calendar', icon: <FiCalendar />, color: 'bg-blue-600', accent: 'from-blue-700 to-blue-900' },
  { key: 'emails', label: 'Emails', icon: <FiMail />, color: 'bg-green-600', accent: 'from-green-700 to-green-900' },
]

function AddTaskModal({ open, onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [urgency, setUrgency] = useState('medium')
  const [show, setShow] = useState(false)
  useEffect(() => { if (open) setShow(true); else setTimeout(() => setShow(false), 200); }, [open])
  if (!open && !show) return null
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-zinc-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 w-full max-w-md relative transform transition-all duration-200 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-200" onClick={onClose} aria-label="Close">×</button>
        <h2 className="text-2xl font-bold mb-4 text-white">Add Task</h2>
        <form onSubmit={e => { e.preventDefault(); onAdd({ title, desc, urgency }); onClose(); }}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1 text-gray-300">Title</label>
            <input className="w-full border border-zinc-700 bg-zinc-800 text-white rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
            <textarea className="w-full border border-zinc-700 bg-zinc-800 text-white rounded px-3 py-2" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">Urgency</label>
            <select className="w-full border border-zinc-700 bg-zinc-800 text-white rounded px-3 py-2" value={urgency} onChange={e => setUrgency(e.target.value)}>
              <option value="urgent">Urgent</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all shadow-lg">Add Task</button>
        </form>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('suggestions')
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [tasks, setTasks] = useState([
    { title: 'Finish project proposal', desc: 'Complete the draft and send to the team.', urgency: 'urgent', due: 'Today' },
    { title: 'Review meeting notes', desc: 'Summarize and share with stakeholders.', urgency: 'medium', due: 'Tomorrow' },
  ])
  const isEmpty = false // set to true to see empty state

  // Animation for tab content
  const prevTab = useRef(activeTab)
  const [tabContent, setTabContent] = useState(activeTab)
  const [tabTransition, setTabTransition] = useState('')

  useEffect(() => {
    if (prevTab.current !== activeTab) {
      setTabTransition('animate-tab-fadeout')
      setTimeout(() => {
        setTabContent(activeTab)
        setTabTransition('animate-tab-fadein')
        setTimeout(() => setTabTransition(''), 400)
      }, 300)
      prevTab.current = activeTab
    }
  }, [activeTab, tabContent])

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] gap-6 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
      {/* Vertical glassmorphic sidebar */}
      <div className="hidden lg:flex flex-col items-center py-8 px-2 gap-4 bg-zinc-100/70 dark:bg-zinc-900/70 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800 shadow-xl min-w-[80px] max-w-[80px] rounded-2xl mt-6 ml-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`group flex flex-col items-center justify-center w-14 h-14 my-2 rounded-xl transition-all duration-200 hover:scale-110 focus:outline-none ${activeTab === tab.key ? `${tab.color} shadow-lg ring-2 ring-yellow-400` : 'bg-zinc-800/60 hover:bg-zinc-700/80'}`}
            onClick={() => setActiveTab(tab.key)}
            aria-label={tab.label}
          >
            <span className={`text-2xl mb-1 transition-all duration-200 ${activeTab === tab.key ? 'text-white drop-shadow' : 'text-zinc-400 group-hover:text-yellow-400'}`}>{tab.icon}</span>
            <span className={`text-xs font-semibold ${activeTab === tab.key ? 'text-white' : 'text-zinc-400'}`}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-800 overflow-hidden mt-6">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-sm text-gray-600">Powered by GPT-4</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Notification bell */}
            <NotificationBell 
              onNotificationClick={(notification) => {
                console.log('Notification clicked:', notification)
                if (notification.action?.type === 'open_suggestions') {
                  setSuggestionsOpen(true)
                }
              }}
            />
            {/* Mobile suggestions button */}
            <button
              onClick={() => setSuggestionsOpen(true)}
              className="lg:hidden btn btn-primary btn-sm"
            >
              <span role="img" aria-label="suggestions" className="mr-2">💡</span>
              Suggestions
            </button>
          </div>
        </div>
        
        {/* Chat content */}
        <div className="flex-1 flex flex-col">
          <ChatThread />
          <ChatInputBar />
        </div>
      </div>

      {/* Floating glassy card for active tab content */}
      <div className="hidden lg:flex flex-col items-center flex-1 mt-6 mr-6">
        <div className={`relative z-10 w-[420px] max-w-full min-h-[420px] bg-zinc-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-zinc-800 p-8 transition-all duration-300 ${tabTransition}`}
          style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' }}>
          {tabContent === 'suggestions' && (
            <div>
              <h2 className="text-3xl font-extrabold mb-4 flex items-center gap-2 text-yellow-400"><FiZap />Smart Suggestions</h2>
              <div className="text-zinc-300 mb-6 text-lg">AI will analyze your conversations and provide helpful suggestions.</div>
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 animate-fadein">
                  <span className="text-6xl mb-2">🤖</span>
                  <div className="font-semibold">No suggestions yet</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-900/40 shadow hover:scale-105 transition-all cursor-pointer">
                    <span className="text-yellow-400 text-2xl"><FiCheckSquare /></span>
                    <span className="font-semibold text-zinc-100">Task reminders</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-900/40 shadow hover:scale-105 transition-all cursor-pointer">
                    <span className="text-blue-400 text-2xl"><FiCalendar /></span>
                    <span className="font-semibold text-zinc-100">Calendar events</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-900/40 shadow hover:scale-105 transition-all cursor-pointer">
                    <span className="text-green-400 text-2xl"><FiMail /></span>
                    <span className="font-semibold text-zinc-100">Email follow-ups</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {tabContent === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold flex items-center gap-2 text-red-400"><FiCheckSquare />Tasks</h2>
                <button className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all shadow-lg" onClick={() => setAddTaskOpen(true)}>
                  <FiPlus className="text-lg" /> Add Task
                </button>
              </div>
              {isEmpty || tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 animate-fadein">
                  <span className="text-6xl mb-2">📋</span>
                  <div className="font-semibold">No tasks yet</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task, i) => (
                    <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl shadow-lg bg-zinc-800/90 border-l-8 ${task.urgency === 'urgent' ? 'border-red-600' : task.urgency === 'medium' ? 'border-yellow-600' : 'border-green-600'} animate-fadein-slideup`} style={{ animationDelay: `${i * 80}ms` }}>
                      <span className={`text-3xl ${task.urgency === 'urgent' ? 'text-red-400' : task.urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}><FiCheckSquare /></span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-zinc-100">{task.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${task.urgency === 'urgent' ? 'bg-red-900 text-red-300' : task.urgency === 'medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>{task.urgency.charAt(0).toUpperCase() + task.urgency.slice(1)}</span>
                        </div>
                        <div className="text-zinc-300 text-sm mb-1">{task.desc}</div>
                        <div className="text-xs text-zinc-500">Due: {task.due}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <AddTaskModal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} onAdd={task => setTasks([...tasks, { ...task, due: 'TBD' }])} />
            </div>
          )}
          {tabContent === 'calendar' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold flex items-center gap-2 text-blue-400"><FiCalendar />Calendar</h2>
                <button className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-lg">
                  <FiPlus className="text-lg" /> Add Event
                </button>
              </div>
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 animate-fadein">
                  <span className="text-6xl mb-2">📅</span>
                  <div className="font-semibold">No events yet</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 rounded-2xl shadow-lg bg-zinc-800/90 border-l-8 border-blue-600 animate-fadein-slideup">
                    <span className="text-3xl text-blue-400"><FiCalendar /></span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-zinc-100">Team Sync</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-300">Meeting</span>
                      </div>
                      <div className="text-zinc-300 text-sm mb-1">Discuss project milestones and blockers.</div>
                      <div className="text-xs text-zinc-500">2:00 PM</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {tabContent === 'emails' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold flex items-center gap-2 text-green-400"><FiMail />Emails</h2>
                <button className="flex items-center gap-1 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 active:scale-95 transition-all shadow-lg">
                  <FiPlus className="text-lg" /> Compose Email
                </button>
              </div>
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 animate-fadein">
                  <span className="text-6xl mb-2">📧</span>
                  <div className="font-semibold">No emails yet</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 rounded-2xl shadow-lg bg-zinc-800/90 border-l-8 border-green-600 animate-fadein-slideup">
                    <span className="text-3xl text-green-400"><FiMail /></span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-zinc-100">Client Proposal</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900 text-green-300">Follow-up</span>
                      </div>
                      <div className="text-zinc-300 text-sm mb-1">Send a follow-up email to the client regarding the proposal.</div>
                      <div className="text-xs text-zinc-500">3 days ago</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile suggestions modal remains unchanged */}
      <SuggestionsPanel 
        isOpen={suggestionsOpen} 
        onClose={() => setSuggestionsOpen(false)} 
      />
    </div>
  )
}

// GLOBAL DARK MODE: In your tailwind.config.js, set darkMode: 'class' and add 'dark' to your <body> or <html>.
// Or, in your global CSS, set:
// body { background: #18181b; color: #f4f4f5; }
// .dark { background: #18181b; color: #f4f4f5; }
// All backgrounds, cards, and text are now styled for dark mode. 

// Add to your global CSS or Tailwind config:
// .animate-tab-fadein { opacity: 0; transform: translateY(1rem); animation: tabfadein 0.4s cubic-bezier(0.4,0,0.2,1) forwards; }
// .animate-tab-fadeout { opacity: 1; transform: translateY(0); animation: tabfadeout 0.3s cubic-bezier(0.4,0,0.2,1) forwards; }
// @keyframes tabfadein { to { opacity: 1; transform: translateY(0); } }
// @keyframes tabfadeout { to { opacity: 0; transform: translateY(-1rem); } } 