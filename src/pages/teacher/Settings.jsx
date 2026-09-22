import { TeacherShell } from './TeacherShell'
import { Card } from '../../components/ui'

export default function TeacherSettings() {
  return (
    <TeacherShell title="Settings" subtitle="Class & notification preferences">
      <div className="grid sm:grid-cols-2 gap-5 max-w-3xl">
        <Card>
          <p className="font-display font-bold text-slate-700 mb-3">Notifications</p>
          <label className="flex items-center justify-between py-2"><span className="text-sm text-slate-600">Weekly class summary</span><input type="checkbox" defaultChecked className="w-10 h-6 accent-brand-500" /></label>
          <label className="flex items-center justify-between py-2"><span className="text-sm text-slate-600">Risk indicator alerts</span><input type="checkbox" defaultChecked className="w-10 h-6 accent-brand-500" /></label>
        </Card>
        <Card>
          <p className="font-display font-bold text-slate-700 mb-3">Privacy</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Student data is only visible to authorized teacher and parent accounts. Demo mode uses fictional data only.
          </p>
        </Card>
      </div>
    </TeacherShell>
  )
}
