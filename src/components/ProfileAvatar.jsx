import { colorFor } from './ui'

export function ProfileAvatar({ emoji, name, colorName = 'brand', size = 56, ring = false }) {
  const c = colorFor(colorName)
  return (
    <div
      className={`rounded-full ${c.bgSoft} flex items-center justify-center shrink-0 ${ring ? `ring-4 ${c.ring}` : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      title={name}
    >
      {emoji}
    </div>
  )
}
