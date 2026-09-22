export const LANGUAGES = [
  { code: 'en', label: 'English', name: 'English', flag: '🇬🇧' },
  { code: 'te', label: 'తెలుగు (Telugu)', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी (Hindi)', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
]

export const STRINGS = {
  en: {
    readyAdventure: 'Ready for today\'s adventure?',
    startLearning: 'START LEARNING',
    continueLearning: 'Continue Learning',
    recommendedForYou: 'Recommended For You',
    playLearn: 'Play & Learn',
    storyTime: 'Story Time',
    speakRead: 'Speak & Read',
    myJourney: 'My Journey',
    home: 'Home',
    learn: 'Learn',
    play: 'Play',
    stories: 'Stories',
    profile: 'Profile',
    journey: 'Journey',
    greeting: 'Hi',
  },
  te: {
    readyAdventure: 'ఈరోజు సాహసానికి సిద్ధమా?',
    startLearning: 'నేర్చుకోవడం మొదలు పెట్టు',
    continueLearning: 'కొనసాగించు',
    recommendedForYou: 'మీ కోసం సూచనలు',
    playLearn: 'ఆడుతూ నేర్చుకో',
    storyTime: 'కథల సమయం',
    speakRead: 'మాట్లాడు & చదువు',
    myJourney: 'నా ప్రయాణం',
    home: 'హోమ్',
    learn: 'నేర్చుకో',
    play: 'ఆడు',
    stories: 'కథలు',
    profile: 'ప్రొఫైల్',
    journey: 'ప్రయాణం',
    greeting: 'హాయ్',
  },
  hi: {
    readyAdventure: 'आज के रोमांच के लिए तैयार हो?',
    startLearning: 'सीखना शुरू करें',
    continueLearning: 'सीखना जारी रखें',
    recommendedForYou: 'आपके लिए सुझाव',
    playLearn: 'खेलो और सीखो',
    storyTime: 'कहानी का समय',
    speakRead: 'बोलो और पढ़ो',
    myJourney: 'मेरी यात्रा',
    home: 'होम',
    learn: 'सीखें',
    play: 'खेलें',
    stories: 'कहानियाँ',
    profile: 'प्रोफ़ाइल',
    journey: 'यात्रा',
    greeting: 'नमस्ते',
  },
}

export function t(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key
}
