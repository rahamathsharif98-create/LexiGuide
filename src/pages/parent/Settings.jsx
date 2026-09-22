import { ParentShell } from './ParentShell'
import { Card } from '../../components/ui'

export default function ParentSettings() {
  return (
    <ParentShell title="Settings" subtitle="Account & notification preferences">
      <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
        <Card>
          <p className="font-display font-bold text-slate-700 mb-3">Notifications</p>
          <Toggle label="Weekly progress summary" defaultOn />
          <Toggle label="Persistent pattern alerts" defaultOn />
          <Toggle label="New achievement notifications" />
        </Card>
        <Card>
          <p className="font-display font-bold text-slate-700 mb-3">Privacy</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your child's data is only visible to linked parent and teacher accounts. Demo mode uses fictional
            data only — no real child information is stored.
          </p>
        </Card>
      </div>
    </ParentShell>
  )
}

function Toggle({ label, defaultOn = false }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-slate-600">{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} className="w-10 h-6 accent-brand-500" />
    </label>
  )
}
