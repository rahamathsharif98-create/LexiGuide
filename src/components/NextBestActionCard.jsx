import { useNavigate } from 'react-router-dom'
import { Card, Button, Skeleton } from './ui'

export function NextBestActionCard({
  nextBestAction,
  loading = false,
  error = null,
  onRetry = null,
  onPlay = null,
  title = "Your Next Adventure 🌟",
  className = "",
  compact = false,
}) {

  const navigate = useNavigate()

  if (loading) {
    return (
      <div className={`mb-8 ${className}`} data-testid="next-best-action-loading">
        <Skeleton className="h-48 w-full rounded-[2rem]" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className={`my-6 bg-coral-50 border border-coral-200 text-center ${className}`} data-testid="next-best-action-error">
        <p className="font-display font-bold text-coral-600 mb-1">Could not determine next best action ⚠️</p>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        {onRetry && (
          <div className="flex justify-center">
            <Button size="sm" onClick={onRetry}>Tap to Retry 🔄</Button>
          </div>
        )}
      </Card>
    )
  }

  if (!nextBestAction || !nextBestAction.best_action) {
    return null
  }

  const { best_action, alternatives = [], explanation, disclaimer } = nextBestAction
  const isVariety = Boolean(best_action.is_variety_switch)
  const isSpaced = best_action.recommendation_type === 'spaced_practice'
  const isOnboarding = best_action.recommendation_type === 'onboarding'

  return (
    <div className={`mb-8 ${className}`} data-testid="next-best-action-card">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#08233A]">
          {title}
        </h3>
        {best_action.difficulty_label && (
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#DDF9FC] text-[#08233A] border border-[#D7EEF1]">
            Level {best_action.difficulty} • {best_action.difficulty_label}
          </span>
        )}
      </div>

      {/* Primary Next-Best-Action hero banner */}
      <div className="relative rounded-[28px] bg-[linear-gradient(135deg,#08233A_0%,#0B5264_55%,#13CFE3_100%)] text-white p-6 sm:p-7 overflow-hidden shadow-[0_12px_40px_rgba(8,35,58,0.12)] border-b-4 border-[#08233A]">
        <div className="absolute -right-4 -bottom-4 text-8xl opacity-20 select-none pointer-events-none">
          {best_action.icon || '📖'}
        </div>

        {/* Dynamic Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {isVariety && (
            <span
              className="inline-flex items-center gap-1 bg-[#FFC857] text-[#08233A] text-xs font-extrabold px-3 py-0.5 rounded-full shadow-sm"
              data-testid="variety-switch-badge"
            >
              <span>🎨</span> Fresh Challenge
            </span>
          )}
          {isSpaced && (
            <span
              className="inline-flex items-center gap-1 bg-[#DDF9FC] text-[#08233A] text-xs font-extrabold px-3 py-0.5 rounded-full shadow-sm"
              data-testid="spaced-practice-badge"
            >
              <span>🔄</span> Memory Refresh
            </span>
          )}
          {isOnboarding && (
            <span
              className="inline-flex items-center gap-1 bg-[#39B87F] text-white text-xs font-extrabold px-3 py-0.5 rounded-full shadow-sm"
              data-testid="onboarding-badge"
            >
              <span>🌱</span> Discovery Step
            </span>
          )}
        </div>

        <h2
          className="font-display font-black text-2xl sm:text-3xl mb-2.5 text-white tracking-tight leading-tight"
          data-testid="best-action-title"
        >
          {best_action.title}
        </h2>

        {/* Explainability / WHY */}
        <div className="mb-5 bg-black/20 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15" data-testid="best-action-why">
          <div className="flex items-start gap-2">
            <span className="inline-block bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider shrink-0 mt-0.5">
              WHY?
            </span>
            <span className="text-white/90 text-xs sm:text-sm font-medium leading-relaxed">
              {best_action.reason || explanation || "Ready for your next learning step!"}
            </span>
          </div>
          {best_action.goal && (
            <p className="text-[11px] font-semibold text-[#DDF9FC] mt-1.5 pl-1">
              🎯 Goal: {best_action.goal}
            </p>
          )}
        </div>

        {/* CTA Play Button */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              if (onPlay) {
                onPlay(best_action.route || '/child/read')
              } else {
                navigate(best_action.route || '/child/read')
              }
            }}
            data-testid="best-action-play-btn"
            className="inline-flex items-center gap-2.5 bg-[#13CFE3] text-[#08233A] hover:bg-white active:scale-95 transition-all font-display font-black px-7 py-3.5 rounded-2xl shadow-lg text-base border-b-4 border-[#0899AA]"
          >
            PLAY NOW <span className="text-lg">▶</span>
          </button>

          <span className="text-xs font-semibold text-[#DDF9FC] hidden sm:inline">
            Estimated ~3 mins
          </span>
        </div>
      </div>

      {/* Ranked Alternatives Section */}
      {alternatives && alternatives.length > 0 && !compact && (
        <div className="mt-5" data-testid="nba-alternatives-list">
          <p className="text-xs font-bold text-[#527080] uppercase tracking-wider px-1 mb-2.5">
            Or try these options:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alternatives.map((alt) => (
              <div
                key={alt.activity_id || alt.title}
                data-testid="alternative-item"
                className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-[#D7EEF1] hover:border-[#13CFE3] transition-all shadow-[0_4px_16px_rgba(8,35,58,0.04)]"
              >
                <div className="w-11 h-11 rounded-xl bg-[#DDF9FC] flex items-center justify-center text-2xl shrink-0">
                  {alt.icon || '⭐'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display font-extrabold text-[#08233A] text-sm truncate">
                      {alt.title}
                    </p>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E6F8FA] text-[#527080] shrink-0 border border-[#D7EEF1]">
                      #{alt.priority}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[#527080] truncate mt-0.5">
                    {alt.fit_reason || alt.reason}
                  </p>
                </div>
                <button
                  onClick={() => navigate(alt.route || '/child/read')}
                  data-testid="alternative-play-btn"
                  className="px-3.5 py-2 rounded-xl bg-[#E6F8FA] hover:bg-[#13CFE3] hover:text-[#08233A] text-[#08233A] text-xs font-extrabold transition-all shrink-0 border border-[#D7EEF1]"
                >
                  PLAY
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {disclaimer && (
        <p className="text-[10px] text-[#527080] italic mt-3 px-1 text-center" data-testid="nba-disclaimer">
          {disclaimer}
        </p>
      )}
    </div>
  )
}
