/**
 * Phase 3: Personalization Engine
 * 
 * CORE PRINCIPLE:
 * Interest Profile != Learning Profile
 * 
 * Interests (space, animals, colours, music taste) change ONLY presentation:
 * - Theme palette and ambient visuals
 * - Mascot/character set
 * - Story vocabulary and context framing
 * - Reward badges & celebration tokens
 * - Music atmosphere & category
 * 
 * Interests MUST NEVER influence:
 * - Skill difficulty thresholds
 * - Recommended skill focus
 * - Activity pacing or diagnostic evaluations
 */

export const THEME_PACKAGES = {
  space: {
    id: 'space',
    name: 'Cosmic Adventure',
    mascot: 'Nova the Cosmic Stargazer 🚀',
    emoji: '🌌',
    heroGreeting: 'Welcome to your Cosmic Learning Station!',
    bgGradient: 'from-slate-900 via-indigo-950 to-purple-950',
    cardBg: 'bg-indigo-900/60 border-indigo-500/30 text-indigo-100',
    primaryColor: '#6366f1',
    badgeIcon: '🪐',
    rewardTitle: 'Starlight Badge',
    musicCategory: 'Space',
    activityTheming: {
      'Sound Safari': { themedTitle: 'Sound Mission', themedIcon: '🚀', context: 'Tune your antenna to hear cosmic phonemes!' },
      'Word Builder': { themedTitle: 'Word Planet', themedIcon: '🪐', context: 'Assemble orbit words to power up the spaceship.' },
      'Speak & Shine': { themedTitle: 'Star Communicator', themedIcon: '⭐', context: 'Transmit clear speech across galaxies.' },
      'Read With Me': { themedTitle: 'Cosmic Logbook', themedIcon: '📖', context: 'Read through planetary discovery logs.' },
      'Story Challenge': { themedTitle: 'Space Odyssey', themedIcon: '🛸', context: 'Explore wondrous constellations in deep space.' },
      'Trace & Speak': { themedTitle: 'Star Trace & Say', themedIcon: '✍️', context: 'Trace cosmic constellations and speak star words!' },
      'Trace & Say': { themedTitle: 'Star Trace & Say', themedIcon: '✍️', context: 'Trace cosmic constellations and speak star words!' },
    },
  },
  animals: {
    id: 'animals',
    name: 'Jungle Explorers',
    mascot: 'Barnaby the Safari Bear 🐾',
    emoji: '🌿',
    heroGreeting: 'Welcome to the Animal Safari Camp!',
    bgGradient: 'from-emerald-900 via-teal-950 to-green-950',
    cardBg: 'bg-emerald-900/60 border-emerald-500/30 text-emerald-100',
    primaryColor: '#10b981',
    badgeIcon: '🐾',
    rewardTitle: 'Safari Paw Badge',
    musicCategory: 'Nature',
    activityTheming: {
      'Sound Safari': { themedTitle: 'Animal Sound Safari', themedIcon: '🦁', context: 'Listen closely to creatures whispering sounds in the wild!' },
      'Word Builder': { themedTitle: 'Word Jungle', themedIcon: '🐾', context: 'Gather friendly animal letters along the river trail.' },
      'Speak & Shine': { themedTitle: 'Parrot Calling', themedIcon: '🦜', context: 'Say words clearly with the chatty jungle birds.' },
      'Read With Me': { themedTitle: 'Safari Storybook', themedIcon: '📖', context: 'Follow baby elephant journey through grasslands.' },
      'Story Challenge': { themedTitle: 'Wildwood Tales', themedIcon: '🦊', context: 'Discover how forest friends help each other.' },
      'Trace & Speak': { themedTitle: 'Animal Trail Trace & Say', themedIcon: '🐾', context: 'Trace animal footprints and repeat jungle calls!' },
      'Trace & Say': { themedTitle: 'Animal Trail Trace & Say', themedIcon: '🐾', context: 'Trace animal footprints and repeat jungle calls!' },
    },
  },
  music: {
    id: 'music',
    name: 'Melody Wonder',
    mascot: 'Lyra the Melody Sprite 🎵',
    emoji: '🎶',
    heroGreeting: 'Welcome to your Musical Soundstage!',
    bgGradient: 'from-purple-900 via-fuchsia-950 to-pink-950',
    cardBg: 'bg-purple-900/60 border-purple-500/30 text-purple-100',
    primaryColor: '#a855f7',
    badgeIcon: '🎼',
    rewardTitle: 'Harmony Star',
    musicCategory: 'Happy',
    activityTheming: {
      'Sound Safari': { themedTitle: 'Rhythm Sound Beats', themedIcon: '🎵', context: 'Tap the sound rhythm to unlock musical harmony.' },
      'Word Builder': { themedTitle: 'Word Symphonies', themedIcon: '🎹', context: 'Play letter keys to create complete word tunes.' },
      'Speak & Shine': { themedTitle: 'Sing & Speak', themedIcon: '🎤', context: 'Speak with lively rhythm and joyful melody.' },
      'Read With Me': { themedTitle: 'Lyric Reader', themedIcon: '🎼', context: 'Read along with the cheerful forest orchestra.' },
      'Story Challenge': { themedTitle: 'The Magic Flute Story', themedIcon: '🎶', context: 'Follow the wandering minstrel through enchanted valleys.' },
      'Trace & Speak': { themedTitle: 'Rhythm Trace & Say', themedIcon: '🎼', context: 'Trace musical notes and sing out letters!' },
      'Trace & Say': { themedTitle: 'Rhythm Trace & Say', themedIcon: '🎼', context: 'Trace musical notes and sing out letters!' },
    },
  },
  nature: {
    id: 'nature',
    name: 'Forest Kingdom',
    mascot: 'Bramble the Sprout Hedgehog 🌿',
    emoji: '🌲',
    heroGreeting: 'Welcome to the Enchanted Forest Glade!',
    bgGradient: 'from-green-900 via-emerald-950 to-lime-950',
    cardBg: 'bg-green-900/60 border-green-500/30 text-green-100',
    primaryColor: '#22c55e',
    badgeIcon: '🍃',
    rewardTitle: 'Golden Leaf',
    musicCategory: 'Nature',
    activityTheming: {
      'Sound Safari': { themedTitle: 'Whispering Leaves', themedIcon: '🍃', context: 'Listen to the gentle breeze whispering sounds.' },
      'Word Builder': { themedTitle: 'Root & Sprout Words', themedIcon: '🌱', context: 'Plant letter seeds to grow thriving words.' },
      'Speak & Shine': { themedTitle: 'Meadow Voice', themedIcon: '☀️', context: 'Speak warm words to brighten the sunny meadow.' },
      'Read With Me': { themedTitle: 'Treehouse Tales', themedIcon: '📖', context: 'Read stories carved into ancient friendly oaks.' },
      'Story Challenge': { themedTitle: 'River Spring Quest', themedIcon: '💧', context: 'Explore pristine waterfalls and secret grottos.' },
      'Trace & Speak': { themedTitle: 'Sprout Trace & Say', themedIcon: '🌿', context: 'Trace winding vines and speak forest sounds!' },
      'Trace & Say': { themedTitle: 'Sprout Trace & Say', themedIcon: '🌿', context: 'Trace winding vines and speak forest sounds!' },
    },
  },
  default: {
    id: 'default',
    name: 'Discovery World',
    mascot: 'Pip the Cozy Fox 🦊',
    emoji: '✨',
    heroGreeting: 'Welcome to your Learning Adventure!',
    bgGradient: 'from-sky-50 to-white',
    cardBg: 'bg-white border-slate-100 text-slate-800',
    primaryColor: '#0ea5e9',
    badgeIcon: '⭐',
    rewardTitle: 'Golden Star',
    musicCategory: 'Discovery',
    activityTheming: {
      'Sound Safari': { themedTitle: 'Sound Safari', themedIcon: '🦁', context: 'Explore sounds in nature.' },
      'Word Builder': { themedTitle: 'Word Builder', themedIcon: '🧩', context: 'Build words block by block.' },
      'Speak & Shine': { themedTitle: 'Speak & Shine', themedIcon: '🎤', context: 'Practice speaking with confidence.' },
      'Read With Me': { themedTitle: 'Read With Me', themedIcon: '📖', context: 'Read along with your guide.' },
      'Story Challenge': { themedTitle: 'Story Challenge', themedIcon: '📚', context: 'Embark on reading adventures.' },
      'Trace & Speak': { themedTitle: 'Trace & Say', themedIcon: '✍️', context: 'Trace letters with your finger and speak magic words!' },
      'Trace & Say': { themedTitle: 'Trace & Say', themedIcon: '✍️', context: 'Trace letters with your finger and speak magic words!' },
    },
  },
}

/**
 * Resolves a child's interest profile into a presentation Theme Package.
 * Pure presentation transform: does NOT alter learning scores or recommendations.
 */
export function resolveThemePackage(childInterests = {}) {
  const categories = childInterests?.interest_categories || childInterests?.categories || childInterests?.interests || []
  const primaryInterest = categories[0]?.toLowerCase()

  if (primaryInterest && THEME_PACKAGES[primaryInterest]) {
    return {
      ...THEME_PACKAGES[primaryInterest],
      favoriteColor: childInterests.favorite_color || null,
      favoriteAnimal: childInterests.favorite_animal || null,
      customMascot: childInterests.favorite_character || THEME_PACKAGES[primaryInterest].mascot,
    }
  }

  return {
    ...THEME_PACKAGES.default,
    favoriteColor: childInterests.favorite_color || null,
    favoriteAnimal: childInterests.favorite_animal || null,
  }
}

/**
 * Applies presentation theming to an activity recommendation without changing its difficulty or logic.
 */
export function applyThemeToActivity(activity, themePackage) {
  if (!activity || !themePackage?.activityTheming) return activity

  const themeMeta = themePackage.activityTheming[activity.title]
  if (!themeMeta) {
    return {
      ...activity,
      themeApplied: false,
      themeId: themePackage.id,
    }
  }

  return {
    ...activity,
    themedTitle: themeMeta.themedTitle,
    themedIcon: themeMeta.themedIcon,
    themeContext: themeMeta.context,
    themeApplied: true,
    themeId: themePackage.id,
  }
}
