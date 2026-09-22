/**
 * LexiGuide Child Experience Design Tokens (Phase 2)
 *
 * Dedicated sensory design tokens engineered for young learners (ages 4–10)
 * with dyslexia, ADHD, and sensory sensitivities.
 *
 * Guidelines:
 * - Peaceful Sanctuary Palette: Calm, low-fatigue backgrounds, avoiding harsh glare.
 * - Generous Touch Targets: Minimum 48px tactile tap surfaces for developing motor skills.
 * - Clear Visual Milestones: Dot progress indicators over high-pressure percentages.
 * - Calmed Domain Themes: Gentle pastel cards with solid contrast borders rather than vibrating neon gradients.
 */

export const CHILD_COLORS = {
  // Peaceful Canvas Foundations
  canvas: '#F2FBFC',
  canvasAlt: '#F6FBFA',
  surface: '#FFFFFF',
  surfaceSoft: '#F8FCFD',
  border: '#D7EEF1',
  borderFocus: '#0899AA',

  // Deep Structural Typography
  textPrimary: '#08233A',
  textSecondary: '#527080',
  textMuted: '#7895A5',

  // Gentle Brand Accents
  primaryCyan: '#13CFE3',
  deepCyan: '#0899AA',
  softCyan: '#DDF9FC',

  // Warm Rewards & Feedback (Non-punitive)
  rewardGold: '#FFC857',
  rewardGoldSoft: '#FFF6E0',
  successGreen: '#39B87F',
  successGreenSoft: '#EBF9F2',
  gentleCoral: '#D95C5C',
  gentleCoralSoft: '#FDF2F2',

  // Sensory Mode Overrides
  focusBg: '#EAF6F8',
  quietMutedText: '#627B8A',
}

export const CHILD_TOUCH_TARGETS = {
  min: '48px',
  hero: '56px',
  primaryCTA: '52px',
  badge: '36px',
  iconButton: '48px',
}

export const CHILD_RADII = {
  pill: '9999px',
  badge: '12px',
  button: '18px',
  card: '24px',
  hero: '28px',
}

export const CHILD_SHADOWS = {
  tactileButton: '0 4px 0 #0899AA, 0 6px 16px rgba(8, 35, 58, 0.08)',
  tactileButtonPressed: '0 1px 0 #0899AA, 0 2px 8px rgba(8, 35, 58, 0.08)',
  cardSubtle: '0 8px 24px rgba(8, 35, 58, 0.05)',
  heroGlow: '0 12px 36px rgba(8, 35, 58, 0.12)',
}

/**
 * Calm Domain Worlds (Read, Speak, Play, Stories)
 * Designed with soothing pastel cards and deep accent boundaries to eliminate visual glare.
 */
export const CHILD_WORLDS = {
  read: {
    id: 'read',
    label: 'Read',
    sublabel: 'Guided Stories',
    route: '/child/read',
    badge: 'Reading Grove',
    emoji: '📖',
    bg: 'bg-[#EBF7FD]',
    border: 'border-[#BAE6FD]',
    accent: '#0284C7',
    text: 'text-[#0369A1]',
    iconBg: 'bg-[#BAE6FD]/60',
    shadow: 'shadow-sky-500/10',
  },
  speak: {
    id: 'speak',
    label: 'Speak',
    sublabel: 'Speak & Shine',
    route: '/child/speak',
    badge: 'Speech Studio',
    emoji: '🎤',
    bg: 'bg-[#FEF8EC]',
    border: 'border-[#FDE6BE]',
    accent: '#D97706',
    text: 'text-[#B45309]',
    iconBg: 'bg-[#FDE6BE]/60',
    shadow: 'shadow-amber-500/10',
  },
  play: {
    id: 'play',
    label: 'Play',
    sublabel: 'Arcade & Sound Safari',
    route: '/child/games',
    badge: 'Arcade Realm',
    emoji: '🎮',
    bg: 'bg-[#F3F0FF]',
    border: 'border-[#DDD6FE]',
    accent: '#7C3AED',
    text: 'text-[#6D28D9]',
    iconBg: 'bg-[#DDD6FE]/60',
    shadow: 'shadow-purple-500/10',
  },
  stories: {
    id: 'stories',
    label: 'Stories',
    sublabel: 'Story Sanctuary',
    route: '/child/stories',
    badge: 'Story Woods',
    emoji: '📚',
    bg: 'bg-[#EEF8F3]',
    border: 'border-[#CDEFD9]',
    accent: '#059669',
    text: 'text-[#047857]',
    iconBg: 'bg-[#CDEFD9]/60',
    shadow: 'shadow-emerald-500/10',
  },
}

export default {
  colors: CHILD_COLORS,
  touchTargets: CHILD_TOUCH_TARGETS,
  radii: CHILD_RADII,
  shadows: CHILD_SHADOWS,
  worlds: CHILD_WORLDS,
}
