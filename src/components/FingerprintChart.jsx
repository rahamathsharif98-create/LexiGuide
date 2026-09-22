import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { SKILL_KEYS, SKILL_LABELS, SKILL_COLORS } from '../data/demoData'

export function FingerprintRadar({ fingerprint, height = 300 }) {
  const data = SKILL_KEYS.map((k) => ({ skill: SKILL_LABELS[k].split(' ')[0], full: SKILL_LABELS[k], value: fingerprint[k] }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#cbd5e1' }} />
        <Radar name="Skills" dataKey="value" stroke="#12aeef" fill="#12aeef" fillOpacity={0.35} strokeWidth={2} />
        <Tooltip formatter={(v) => `${v}%`} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function FingerprintTrend({ history, height = 260, skills = SKILL_KEYS }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={history} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {skills.map((k) => (
          <Line key={k} type="monotone" dataKey={k} name={SKILL_LABELS[k]} stroke={SKILL_COLORS[k]} strokeWidth={2.5} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
