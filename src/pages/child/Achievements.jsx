import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { ACHIEVEMENTS } from '../../data/demoData'
import { AchievementBadge } from '../../components/AchievementBadge'
import { Card, Button, Skeleton } from '../../components/ui'
import { endpoints } from '../../services/api'

export default function Achievements() {
  const { activeChild, isRealBackend, achievementsData, achievementsLoading, achievementsError, refreshAchievements } = useApp()

  useEffect(() => {
    if (isRealBackend) {
      refreshAchievements()
    }
  }, [isRealBackend, refreshAchievements])

  const achievements = isRealBackend
    ? (achievementsData && achievementsData.length > 0 ? achievementsData : [])
    : ACHIEVEMENTS

  const loading = isRealBackend && achievementsLoading
  const error = isRealBackend ? achievementsError : null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-xl text-slate-800 mb-1">Achievements 🏆</h1>
      <p className="text-slate-400 mb-6">Collect badges as you learn and grow!</p>

      {/* Stats header */}
      <Card className="mb-6 flex items-center justify-around text-center">
        <div><p className="text-2xl font-display font-bold text-sun-500">{activeChild.stars}⭐</p><p className="text-xs text-slate-400">Stars</p></div>
        <div><p className="text-2xl font-display font-bold text-coral-500">{activeChild.streak}🔥</p><p className="text-xs text-slate-400">Day streak</p></div>
        <div><p className="text-2xl font-display font-bold text-brand-600">{achievements.filter((a) => a.earned).length}/{achievements.length}</p><p className="text-xs text-slate-400">Badges</p></div>
      </Card>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <Card className="my-6 bg-coral-50 border border-coral-200 text-center">
          <p className="font-display font-bold text-coral-600 mb-1">Could not load achievements ⚠️</p>
          <p className="text-xs text-slate-500 mb-4">{error}</p>
          <div className="flex justify-center">
            <Button size="sm" onClick={refreshAchievements}>Tap to Retry 🔄</Button>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {achievements.map((a) => {
            const { key: _k, ...rest } = a
            return <AchievementBadge key={a.id || a.key} {...rest} />
          })}
        </div>
      )}
    </div>
  )
}
