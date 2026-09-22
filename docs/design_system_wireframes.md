# LexiGuide Child-Friendly Design System & Information Architecture Wireframes

## 1. Design System Tokens & Guidelines

### Typography
- Primary Font: LexiGuide Sans (clean, open counters, tall x-height, distinct letterforms to prevent mirror letter confusion like b/d, p/q).
- Optional Dyslexia Font: OpenDyslexic (weighted bottoms, clear letter orientation).
- Text Rules: Generous letter spacing (`letter-spacing: 0.05em` or `wide`), line-height 1.6-1.8 (`relaxed`), left-aligned only (never justified), strictly avoid ALL CAPS or dense italics.

### Color Palette (Comfortable, Non-Harsh Contrast)
- Soft Pastels & Friendly Accents:
  - Sky Blue: `#38bdf8`
  - Sunny Yellow: `#facc15`
  - Warm Coral: `#fb7185`
  - Mint Green: `#4ade80`
  - Lavender Violet: `#c084fc`
- Backgrounds: Gentle off-white/warm creams (`#f8fafc`, `#f6fbff`), zero harsh stark whites or flashing elements.

### Motion & Micro-interactions
- Reduced Motion Support: Complies with `motion_level = 'none' | 'gentle' | 'full'`.
- Gentle Transitions: Ease-in-out transforms capped at 250ms, calm star shimmer, celebratory confetti with immediate dismissal option.

### Interactive Elements & Ergonomics
- Touch Target: Minimum 48px x 48px clickable/tappable area.
- Icon + Label + Listen Button: Every core action features an intuitive icon, a clear short label, and an optional audio read-aloud button (`🔊`).
- Child Navigation Bar:
  - 🏠 Home (`/child/home`)
  - 📖 Read (`/child/read`)
  - 🔊 Sounds (`/child/games/match-sound`)
  - 🎮 Games (`/child/games`)
  - ⭐ Rewards (`/child/achievements`)
