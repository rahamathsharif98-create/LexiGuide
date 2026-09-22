import { useState } from 'react'
import { STORIES } from '../../data/demoData'
import { StoryCard } from '../../components/StoryCard'
import VoiceModeIndicator from '../../components/VoiceModeIndicator'
import { Sparkles, BookOpen } from 'lucide-react'

const STORY_CATEGORIES = [
  { id: 'all', label: 'All Stories', icon: '📚' },
  { id: 'animals', label: 'Animals', icon: '🐾', keywords: ['fox', 'bear', 'animal', 'curious', 'starfish'] },
  { id: 'space', label: 'Space', icon: '🚀', keywords: ['space', 'star', 'rocket', 'moon'] },
  { id: 'nature', label: 'Nature', icon: '🌳', keywords: ['seed', 'plant', 'tree', 'garden', 'forest', 'rain'] },
  { id: 'music', label: 'Music', icon: '🎵', keywords: ['rhythm', 'sound', 'melody', 'song', 'music'] },
  { id: 'fantasy', label: 'Fantasy', icon: '🏰', keywords: ['castle', 'magic', 'dragon', 'fairytale'] },
]

export default function Stories() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredStories = selectedCategory === 'all'
    ? STORIES
    : STORIES.filter((s) => {
        const cat = STORY_CATEGORIES.find((c) => c.id === selectedCategory)
        if (!cat || !cat.keywords) return true
        const text = `${s.title} ${s.description} ${s.genre || ''}`.toLowerCase()
        return cat.keywords.some((kw) => text.includes(kw))
      })

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#0899AA]">
            Story Woods 🌲
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#08233A]">
            Story Time <span className="select-none">📚</span>
          </h1>
          <p className="text-[#527080] text-sm font-semibold mt-0.5">
            Pick a story to read together!
          </p>
        </div>
        <VoiceModeIndicator />
      </div>

      {/* Hero Welcome Banner */}
      <div className="rounded-3xl bg-[linear-gradient(135deg,#08233A_0%,#0B5264_55%,#13CFE3_100%)] text-white p-6 sm:p-8 flex items-center justify-between gap-4 shadow-[0_12px_40px_rgba(8,35,58,0.12)] border border-[#13CFE3]/30">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} />
            <span>Interactive Storybooks</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white">
            Listen, Read Aloud &amp; Explore!
          </h2>
          <p className="text-[#DDF9FC] text-xs sm:text-sm font-medium mt-1">
            Every story includes child-paced narration, large dyslexia-friendly text, and fun questions!
          </p>
        </div>
        <span className="text-6xl select-none hidden sm:block animate-float">📖</span>
      </div>

      {/* Category Pills (Section 21) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STORY_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
              selectedCategory === cat.id
                ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] shadow-xs'
                : 'bg-white text-[#527080] border-[#D7EEF1] hover:text-[#08233A] hover:bg-[#F2FBFC]'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Storybooks Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-black text-lg text-[#08233A]">
            All Stories ({filteredStories.length})
          </h2>
          <span className="text-xs font-bold text-[#08233A] bg-[#DDF9FC] px-3 py-1 rounded-full border border-[#D7EEF1]">
            Tap to Read
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      </div>
    </div>
  )
}
