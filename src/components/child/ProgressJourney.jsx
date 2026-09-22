import React from 'react'

/**
 * AchievementBadge (Section 23 & Section 36)
 * Friendly accomplishment badge without raw clinical percentages.
 */
export function AchievementBadge({
  icon = '🌟',
  title = 'Explorer',
  description = 'Tried 5 adventures',
  unlocked = true,
  className = '',
}) {
  return (
    <div
      className={`p-4 rounded-3xl border-2 flex items-center gap-3.5 transition-all ${
        unlocked
          ? 'bg-white border-[#D7EEF1] shadow-xs'
          : 'bg-[#F6FBFA] border-[#E2E8F0] opacity-60'
      } ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
          unlocked ? 'bg-[#FEF8EC] border border-[#FDE6BE]' : 'bg-[#E2E8F0]'
        }`}
      >
        {unlocked ? icon : '🔒'}
      </div>
      <div className="min-w-0">
        <p className="font-display font-black text-sm text-[#08233A] truncate">
          {title}
        </p>
        <p className="text-xs text-[#527080] font-semibold truncate mt-0.5">
          {description}
        </p>
      </div>
    </div>
  )
}

/**
 * ProgressJourney (Section 23 & Section 36)
 * Makes learning progress feel like an adventure roadmap instead of a report.
 */
export function ProgressJourney({
  activitiesCount = 0,
  skills = [
    { name: 'Sounds', status: 'Growing 🌱', level: 2 },
    { name: 'Reading', status: 'Practicing 📖', level: 3 },
    { name: 'Speaking', status: 'Exploring 🗣️', level: 1 },
    { name: 'Words', status: 'Mastering 🌟', level: 4 },
  ],
  className = '',
}) {
  return (
    <div className={`bg-white rounded-3xl p-6 border border-[#D7EEF1] shadow-xs space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#0899AA] bg-[#DDF9FC] px-2.5 py-0.5 rounded-full">
            Adventure Road
          </span>
          <h3 className="font-display font-black text-xl text-[#08233A] mt-1">
            ⭐ My Learning Journey
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-[#527080]">
            You've explored
          </span>
          <p className="font-display font-black text-lg text-[#0899AA]">
            {activitiesCount} adventures! 🎒
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {skills.map((skill, index) => (
          <div
            key={index}
            className="p-4 rounded-2xl bg-[#F2FBFC] border border-[#D7EEF1] flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-display font-bold text-sm text-[#08233A]">
                {skill.name}
              </p>
              <p className="text-xs text-[#0899AA] font-bold mt-0.5">
                {skill.status}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < skill.level ? 'bg-[#13CFE3]' : 'bg-[#D7EEF1]'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProgressJourney
