import { useNavigate } from 'react-router-dom'
import { ChildAudioGuideBadge } from './child/ChildAudioGuideBadge'
import { ChildTactileButton } from './child/ChildTactileButton'

export function GameCard({ game }) {
  const navigate = useNavigate()
  const targetRoute = game.route || `/child/games/${game.id}`

  return (
    <div className="group text-center p-5 rounded-[28px] bg-white border-2 border-[#D7EEF1] border-b-4 hover:border-[#13CFE3] transition-all shadow-[0_6px_20px_rgba(8,35,58,0.06)] flex flex-col justify-between items-center h-full relative">
      {/* Top illustration */}
      <div className="w-full flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-[#DDF9FC] border border-[#D7EEF1] flex items-center justify-center text-4xl mb-3 shadow-inner group-hover:scale-105 transition-transform select-none">
          {game.icon}
        </div>

        {/* Large title */}
        <h3 className="font-display font-black text-lg text-[#08233A] tracking-tight mb-1">
          {game.title}
        </h3>

        {/* One short sentence */}
        <p className="text-xs font-semibold text-[#527080] line-clamp-2 px-1 mb-3">
          {game.desc}
        </p>
      </div>

      {/* Audio icon + START button */}
      <div className="w-full pt-3 border-t border-[#D7EEF1] flex flex-col items-center gap-2">
        <ChildAudioGuideBadge
          text={`${game.title}. ${game.desc}`}
          label="Listen"
          className="text-[10px] py-0.5 px-2 bg-[#F2FBFC] hover:bg-[#DDF9FC]"
        />

        <ChildTactileButton
          variant="cyan"
          size="sm"
          onClick={() => navigate(targetRoute)}
          className="w-full"
        >
          START ▶
        </ChildTactileButton>
      </div>
    </div>
  )
}
