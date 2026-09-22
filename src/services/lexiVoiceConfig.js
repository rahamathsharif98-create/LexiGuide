/**
 * LexiGuide — Centralized Voice & Audio Experience Configuration
 * 
 * PERSONALITY:
 * "A kind, patient, intelligent Indian learning companion who gently guides a child."
 * Sweet, humble, warm, calm, patient, encouraging, reassuring, emotionally safe —
 * like a child resting safely in their mother's lap.
 * 
 * EMOTIONAL BALANCE:
 * 70% calm/supportive | 20% warm/playful | 10% excitement
 */

export const LEXI_VOICE_SETTINGS = {
  // Pacing: slightly slower than normal conversation for maximum child comfort
  BASE_RATE: 0.88,       // Standard instruction pacing
  READING_RATE: 0.85,    // Story and passage narration pacing
  WORD_RATE: 0.82,       // Isolated phoneme and vocabulary practice
  PITCH: 1.05,           // Gentle, warm, comforting guide pitch
  MICRO_PAUSE_MS: 320,   // Natural pause between instruction phrases

  SUPPORTED_LOCALES: {
    en: 'en-IN',
    hi: 'hi-IN',
    te: 'te-IN',
  },
}

/**
 * Curated, culturally authentic phrases across the 6 core emotional states.
 * Phrased naturally in each language — NOT machine-translated.
 */
export const LEXI_PHRASE_LIBRARY = {
  en: {
    locale: 'en-IN',
    languageName: 'Indian English',
    welcome: [
      'Hi! Welcome back. Ready for today’s adventure?',
      'Hello there! It is so good to see you again.',
      'Welcome back! Let us learn and have fun together.',
    ],
    instruction: {
      listenThenSay: ['Listen carefully.', 'Now, say it with me.'],
      readAlong: ['Let us read this story together.', 'Listen first, then read aloud.'],
      soundFocus: ['Listen to this sound.', 'Now, try saying it clearly.'],
      traceGuide: ['Trace the letter gently with your finger.', 'Follow the sparkles on the screen.'],
    },
    encouragement: [
      'Nice try! You are getting closer.',
      'Wonderful effort! Keep going.',
      'You are doing really well!',
      'Take your time. There is no rush at all.',
    ],
    success: [
      'Great job! You did it!',
      'Wonderful! That was beautifully spoken.',
      'Super star! Look how much you are learning.',
      'You did that so well! I am so proud of you.',
    ],
    retry: [
      'Almost there! Let us try once more together.',
      'That was very close! Let us listen again.',
      'Good try! We can do it together.',
      'Take a deep breath, and let us try one more time.',
    ],
    processing: [
      'One moment. Let us check that together.',
      'Listening closely…',
      'Checking your sound…',
    ],
  },
  hi: {
    locale: 'hi-IN',
    languageName: 'हिन्दी (Hindi)',
    welcome: [
      'नमस्ते! वापस आने के लिए स्वागत है। क्या आप तैयार हैं?',
      'नमस्ते प्यारे दोस्त! आपको दोबारा देखकर बहुत खुशी हुई।',
      'स्वागत है! चलिए मिलकर कुछ नया और मज़ेदार सीखते हैं।',
    ],
    instruction: {
      listenThenSay: ['ध्यान से सुनें।', 'अब मेरे साथ बोलें।'],
      readAlong: ['चलिए साथ में कहानी पढ़ते हैं।', 'पहले सुनें, फिर बोलें।'],
      soundFocus: ['इस आवाज़ को ध्यान से सुनें।', 'अब साफ़ आवाज़ में बोलें।'],
      traceGuide: ['उँगली से अक्षर को धीरे-धीरे बनाएँ।', 'चमकते बिंदुओं के साथ चलें।'],
    },
    encouragement: [
      'बहुत अच्छी कोशिश! आप बहुत करीब हैं।',
      'शाबाश! ऐसे ही आगे बढ़ते रहें।',
      'आप बहुत अच्छा कर रहे हैं!',
      'कोई जल्दी नहीं है, आराम से करें।',
    ],
    success: [
      'बहुत बढ़िया! आपने कर दिखाया!',
      'शाबाश! आपने बहुत सुंदर बोला।',
      'अद्भुत! आप हर दिन कुछ नया सीख रहे हैं।',
      'वाह! मुझे आप पर गर्व है।',
    ],
    retry: [
      'बस थोड़ा सा और! चलिए मिलकर फिर से कोशिश करते हैं।',
      'बहुत पास पहुँच गए थे! एक बार फिर सुनते हैं।',
      'अच्छी कोशिश! हम मिलकर इसे आसानी से सीख लेंगे।',
      'शांत मन से एक बार फिर बोलते हैं।',
    ],
    processing: [
      'एक पल रुकिए। चलिए साथ में देखते हैं।',
      'ध्यान से सुन रहे हैं…',
      'आपकी आवाज़ की जाँच हो रही है…',
    ],
  },
  te: {
    locale: 'te-IN',
    languageName: 'తెలుగు (Telugu)',
    welcome: [
      'హాయ్! మళ్లీ వచ్చినందుకు స్వాగతం. ఈరోజు నేర్చుకుందామా?',
      'నమస్కారం! నిన్ను మళ్లీ చూడటం చాలా సంతోషంగా ఉంది.',
      'స్వాగతం! రండి, ఇద్దరం కలిసి సరదాగా చదువుకుందాం.',
    ],
    instruction: {
      listenThenSay: ['శ్రద్ధగా వినండి.', 'ఇప్పుడు నాతో చెప్పండి.'],
      readAlong: ['రండి, కలిసి కథ చదువుకుందాం.', 'మొదట విని, తర్వాత చదవండి.'],
      soundFocus: ['ఈ శబ్దాన్ని వినండి.', 'ఇప్పుడు స్పష్టంగా చెప్పండి.'],
      traceGuide: ['వేలితో అక్షరాన్ని నెమ్మదిగా దిద్దండి.', 'మెరుస్తున్న చుక్కలను అనుసరించండి.'],
    },
    encouragement: [
      'మంచి ప్రయత్నం! చక్కగా వస్తోంది.',
      'శభాష్! అలాగే నేర్చుకుంటూ ఉండు.',
      'నువ్వు చాలా బాగా చేస్తున్నావు!',
      'కంగారు పడకు, నెమ్మదిగా చెప్పు.',
    ],
    success: [
      'చాలా బాగుంది! నువ్వు చేసేశావు!',
      'అద్భుతం! ఎంత చక్కగా పలికావు.',
      'సూపర్ స్టార్! రోజురోజుకూ బాగా నేర్చుకుంటున్నావు.',
      'వావ్! నిన్ను చూస్తే చాలా గర్వంగా ఉంది.',
    ],
    retry: [
      'దగ్గరికి వచ్చేశారు! రండి, మళ్లీ ప్రయత్నిద్దాం.',
      'చాలా దగ్గరగా వచ్చింది! మళ్లీ ఒక్కసారి విందాం.',
      'మంచి ప్రయత్నం! ఇద్దరం కలిసి సులభంగా నేర్చేసుకుందాం.',
      'ప్రశాంతంగా ఇంకొక్కసారి ప్రయత్నించు.',
    ],
    processing: [
      'ఒక్క నిమిషం. కలిసి చూద్దాం.',
      'శ్రద్ధగా వింటున్నాము…',
      'నీ స్వరాన్ని పరిశీలిస్తున్నాము…',
    ],
  },
}

/**
 * Prioritizes natural Indian voices based on available system voice packages.
 *
 * Windows, Chrome, macOS, Android, and iOS voice names:
 * - Indian English: Heera, Ravi, Neerja, Veena, Prabhat, Kalyani, India, Microsoft Heera, Google Indian English
 * - Hindi: Kalpana, Hemant, Madhur, Swara, Google हिन्दी, Microsoft Kalpana, Microsoft Hemant
 * - Telugu: Chitra, Mohan, Google తెలుగు, Microsoft Chitra, Microsoft Mohan
 */
export function findLexiCompanionVoice(voices = [], langCode = 'en') {
  if (!Array.isArray(voices) || voices.length === 0) return null

  const targetPrefix = langCode === 'te' ? 'te' : langCode === 'hi' ? 'hi' : 'en'

  if (targetPrefix === 'en') {
    // 1. Exact en-IN locale match
    const exactEnIn = voices.find((v) => {
      const tag = (v.lang || '').replace('_', '-').toLowerCase()
      return tag === 'en-in'
    })
    if (exactEnIn) return exactEnIn

    // 2. Named Indian English voices
    const indianNamed = voices.find((v) => {
      const name = (v.name || '').toLowerCase()
      return (
        name.includes('india') ||
        name.includes('heera') ||
        name.includes('ravi') ||
        name.includes('neerja') ||
        name.includes('veena') ||
        name.includes('kalyani') ||
        name.includes('prabhat')
      )
    })
    if (indianNamed) return indianNamed

    // 3. Fallback to gentle English voice
    return voices.find((v) => (v.lang || '').toLowerCase().startsWith('en')) || null
  }

  if (targetPrefix === 'hi') {
    // 1. Exact hi-IN locale match
    const exactHiIn = voices.find((v) => {
      const tag = (v.lang || '').replace('_', '-').toLowerCase()
      return tag === 'hi-in' || tag === 'hi'
    })
    if (exactHiIn) return exactHiIn

    // 2. Named Hindi voices
    const hindiNamed = voices.find((v) => {
      const name = (v.name || '').toLowerCase()
      return (
        name.includes('hindi') ||
        name.includes('हिन्दी') ||
        name.includes('kalpana') ||
        name.includes('hemant') ||
        name.includes('madhur') ||
        name.includes('swara')
      )
    })
    if (hindiNamed) return hindiNamed

    return voices.find((v) => (v.lang || '').toLowerCase().startsWith('hi')) || null
  }

  if (targetPrefix === 'te') {
    // 1. Exact te-IN locale match
    const exactTeIn = voices.find((v) => {
      const tag = (v.lang || '').replace('_', '-').toLowerCase()
      return tag === 'te-in' || tag === 'te'
    })
    if (exactTeIn) return exactTeIn

    // 2. Named Telugu voices
    const teluguNamed = voices.find((v) => {
      const name = (v.name || '').toLowerCase()
      return (
        name.includes('telugu') ||
        name.includes('తెలుగు') ||
        name.includes('chitra') ||
        name.includes('mohan')
      )
    })
    if (teluguNamed) return teluguNamed

    return voices.find((v) => (v.lang || '').toLowerCase().startsWith('te')) || null
  }

  return null
}

/**
 * Returns clean diagnostic details regarding the companion voice.
 */
export function getLexiCompanionReport(voices = [], langCode = 'en') {
  const voice = findLexiCompanionVoice(voices, langCode)
  const isIndianEnglish = Boolean(
    voice && (
      (voice.lang || '').toLowerCase().includes('en-in') ||
      (voice.name || '').toLowerCase().includes('india') ||
      (voice.name || '').toLowerCase().includes('heera') ||
      (voice.name || '').toLowerCase().includes('ravi') ||
      (voice.name || '').toLowerCase().includes('neerja') ||
      (voice.name || '').toLowerCase().includes('veena')
    )
  )
  const isNativeIndic = Boolean(
    voice && (
      (voice.lang || '').toLowerCase().startsWith(langCode.toLowerCase())
    )
  )

  return {
    langCode,
    targetLocale: LEXI_VOICE_SETTINGS.SUPPORTED_LOCALES[langCode] || 'en-IN',
    matchedVoiceName: voice?.name || 'Local Browser Synthesizer',
    matchedVoiceLang: voice?.lang || LEXI_VOICE_SETTINGS.SUPPORTED_LOCALES[langCode] || 'en-IN',
    hasNativeVoice: Boolean(voice && (langCode === 'en' ? isIndianEnglish : isNativeIndic)),
    isIndianEnglish,
    speakingRate: LEXI_VOICE_SETTINGS.BASE_RATE,
    pitch: LEXI_VOICE_SETTINGS.PITCH,
    pauseBetweenChunksMs: LEXI_VOICE_SETTINGS.MICRO_PAUSE_MS,
  }
}
