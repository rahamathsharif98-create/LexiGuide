import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { endpoints } from '../services/api'
import { Card, Button, Skeleton } from './ui'
import { Search, X, Sparkles, ArrowRight } from 'lucide-react'

const QUICK_TOPICS = [
  { label: 'All', value: '' },
  { label: '🦁 Animals', value: 'animal' },
  { label: '🚀 Space', value: 'space' },
  { label: '📖 Stories', value: 'story' },
  { label: '🧩 Puzzles', value: 'puzzle' },
  { label: '🎤 Speaking', value: 'speak' },
]

export function SearchModal({ isOpen, onClose, childId }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeTopic, setActiveTopic] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setActiveTopic('')
      setResults([])
      return
    }

    const searchTerm = query || activeTopic
    setLoading(true)
    setError(null)

    endpoints.search(searchTerm, { childId })
      .then((res) => {
        setResults(res.results || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message || 'Could not fetch search results')
        setLoading(false)
      })
  }, [isOpen, query, activeTopic, childId])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (route) => {
    onClose()
    navigate(route)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="search-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Learning Search"
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with Search Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <h2 className="font-display font-extrabold text-xl text-slate-800">Learning Search</h2>
          </div>
          <button
            onClick={onClose}
            data-testid="search-modal-close"
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-3">
          <input
            type="text"
            aria-label="Search stories, sounds, or games"
            placeholder="Search stories, sounds, or games..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-10 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick Topic Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic.label}
              onClick={() => {
                setActiveTopic(topic.value)
                setQuery('')
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold shrink-0 transition-colors ${
                activeTopic === topic.value && !query
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {topic.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading && (
            <div className="space-y-3 py-2">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-coral-600 text-sm font-semibold">
              {error}
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <span className="text-4xl block mb-2">🎈</span>
              <p className="font-display font-bold text-slate-600 text-sm">No adventures found</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for "fox", "space", or "sounds"!</p>
            </div>
          )}

          {!loading && !error && results.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.route)}
              className="w-full text-left block group"
            >
              <Card hover className="p-3.5 flex items-center gap-3.5 border border-slate-100 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-sm text-slate-800 truncate">{item.title}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 shrink-0" data-testid="search-item-mode-tag">
                      {item.type === 'speaking' || item.route?.includes('speak') ? '🎙️ Speak' : item.type === 'game' || item.route?.includes('game') ? '🎮 Play' : item.category === 'Sounds' ? '🎧 Sound' : '📖 Read'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{item.description}</p>
                  {item.fit_reason && (
                    <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-mint-600">
                      <Sparkles size={11} className="shrink-0" />
                      <span className="truncate">{item.fit_reason}</span>
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-500 group-hover:text-white transition-colors shrink-0">
                  <ArrowRight size={15} />
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
