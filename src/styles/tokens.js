/**
 * LexiGuide Official Design System Tokens
 *
 * Core Color Hierarchy Target:
 * 60%  APP_BACKGROUND (#F2FBFC)
 * 20%  SURFACE (#FFFFFF)
 * 10%  DEEP_NAVY (#08233A)
 * 7%   PRIMARY_CYAN (#13CFE3)
 * 3%   Semantic & Rewards (Gold #FFC857, Success #39B87F, Error #D95C5C)
 */

export const LEXI_COLORS = {
  // Foundation
  appBackground: '#F2FBFC',
  secondaryBackground: '#E6F8FA',
  surface: '#FFFFFF',
  border: '#D7EEF1',

  // Brand
  primaryCyan: '#13CFE3',
  deepCyan: '#0899AA',
  softCyan: '#DDF9FC',

  // Structure
  deepNavy: '#08233A',
  textSecondary: '#527080',

  // Semantic & Reward
  rewardGold: '#FFC857',
  success: '#39B87F',
  error: '#D95C5C',
}

export const LEXI_GRADIENTS = {
  hero: 'linear-gradient(135deg, #08233A 0%, #0B5264 55%, #13CFE3 100%)',
  softBackground: 'linear-gradient(135deg, #F2FBFC 0%, #E6F8FA 100%)',
  cardSubtle: 'linear-gradient(180deg, #FFFFFF 0%, #F2FBFC 100%)',
  reward: 'linear-gradient(135deg, #FFC857 0%, #FFA834 100%)',
}

export const LEXI_SHADOWS = {
  elevationDefault: '0 8px 30px rgba(8, 35, 58, 0.08)',
  elevationHigh: '0 12px 40px rgba(8, 35, 58, 0.10)',
  elevationSubtle: '0 4px 16px rgba(8, 35, 58, 0.04)',
  glowCyan: '0 0 24px rgba(19, 207, 227, 0.25)',
}

export const LEXI_RADII = {
  sm: '10px',
  md: '16px',
  lg: '24px',
  hero: '28px',
  full: '9999px',
}

export default {
  colors: LEXI_COLORS,
  gradients: LEXI_GRADIENTS,
  shadows: LEXI_SHADOWS,
  radii: LEXI_RADII,
}
