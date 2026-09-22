# LexiGuide "Toy World" Design System Specification & Mascot Roster

## 1. Design System Philosophy & Sensory Grounding

The LexiGuide **"Toy World"** design system is engineered so a child opens the application and immediately feels like they have stepped into a warm, gentle room full of soft, huggable plush toy companions — never an intimidating clinical testing interface or a flat web form.

### A. Non-3D Depth & "Toy Material" Construction
- **Pre-Rendered Digital Sculpting:** Mascots read as chunky, rounded claymation/felt plush figurines with soft matte ambient occlusion, subtle directional lighting, and pillowy curves.
- **Zero Real-Time 3D Overhead:** All mascot artwork is designed as lightweight vector SVG or WebP layers with gradient shading to fake volume without requiring a battery-draining WebGL engine.
- **Tactile Material Feel:**
  - Buttons have subtle pillowy bevels (`border-b-4 active:border-b-0 active:translate-y-1`).
  - Cards feature soft dual-layer diffuse drop shadows (`shadow-[0_8px_30px_rgb(0,0,0,0.06)]`).
  - Interactive elements feature a gentle "squish" bounce on press (`active:scale-95 transition-transform duration-150`).

### B. Color, Material & Contrast Harmony
- **Soft Pastel Canvas:** Off-white/warm creams (`#f8fafc`, `#fefae0`), warm cloud blue (`#f0f9ff`), soft lavender blush (`#faf5ff`).
- **Dark Charcoal Text:** `#1e293b` (slate-800) and `#334155` (slate-700) replacing harsh pure `#000000`.
- **Sensory-Calm Theme Accents:**
  - Cosmic Space: `#6366f1` (Indigo Star) & `#818cf8`
  - Animal Jungle: `#10b981` (Meadow Green) & `#34d399`
  - Melody Music: `#a855f7` (Pastel Violet) & `#c084fc`
  - Enchanted Forest: `#22c55e` (Sprout Green) & `#4ade80`

### C. Typography & Interaction Ergonomics
- **Typeface:** Clean, open sans-serif (LexiGuide Sans) with tall x-height and clear differentiation between mirror glyphs ($b/d, p/q$).
- **Dyslexia Toggle:** OpenDyslexic with weighted bottom baselines.
- **Readability Rules:** `line-height: 1.7` (`relaxed`), `letter-spacing: 0.05em` (`wide`), left-aligned only, zero dense italics or ALL CAPS blocks.
- **Touch Targets:** Minimum 48px × 48px tappable area with generous padding.
- **Audio-First:** Every core card, button, and instruction features an integrated `Listen 🔊` button.

---

## 2. Mascot Roster (Original Plush Companion Guides)

Each major interest theme features an original, hand-sculpted guide mascot who greets the learner at Home, celebrates milestone progress, and speaks instructions through the Listen button:

### 1. Default / Warm World: **"Pip the Cozy Fox" 🦊**
- **Form & Persona:** A chubby, round-eared fox with pillowy cheeks, a creamy marshmallow tummy, and soft warm-coral felt fur.
- **Role:** General reading guide and patient listener who sits quietly beside the child during story reading.
- **Animation States:** Gentle breathing idle, ear twitch on sound playback, joyful hand-clap celebration on session completion.

### 2. Space Theme: **"Nova the Cosmic Stargazer" 🚀**
- **Form & Persona:** A soft lavender puff-critter wearing a padded retro fabric astronaut suit with shiny golden visor details and plush moon boots.
- **Role:** Leads the "Sound Mission" and "Word Planet", encouraging the child to beam clear pronunciation across constellations.
- **Animation States:** Weightless floating bob, antenna sparkle on correct answer, celebratory rocket trail dance.

### 3. Animals Theme: **"Barnaby the Safari Bear" 🐾**
- **Form & Persona:** A plump honey-caramel bear with soft moss-green safari overalls and oversized rounded paws.
- **Role:** Co-adventurer in the "Animal Sound Safari" who listens attentively to phonemes and whispers gentle hints.
- **Animation States:** Curious ear tilt, enthusiastic paw wave, celebration honey-pot toss.

### 4. Music Theme: **"Lyra the Melody Sprite" 🎵**
- **Form & Persona:** A cheerful bell-shaped sprite with soft pastel mint felt wings and musical clef curl antenna.
- **Role:** Directs rhythm word builders, guiding smooth syllable blending with melodic chimes.
- **Animation States:** Rhythmic foot-tap, musical note chime shimmer, twirling celebration spin.

### 5. Nature Theme: **"Bramble the Sprout Hedgehog" 🌿**
- **Form & Persona:** A gentle round hedgehog whose quills are soft green felt clover leaves, with warm berry-button nose.
- **Role:** Tends the "Word Garden", helping children plant letter roots and watch words bloom.
- **Animation States:** Clover leaf rustle, shy warm smile, flower blossom celebration.

---

## 3. Screen Information Architecture Wireframes

The following wireframes explicitly visualize the structural separation between:
- **Interest Profile Data Flow:** Themes, mascots, colors, reward titles, music atmosphere.
- **Learning Evidence Data Flow:** Skill accuracy, difficulty levels, repetition need, pacing.

### Wireframe A: Parent/Child Setup Sequence (Pre-Device Hand-Off)
```
+-------------------------------------------------------------------------------+
|  LEXIGUIDE SETUP (Parent / Guardian)                           [🔊 Step Audio]|
+-------------------------------------------------------------------------------+
|  Step [●--○--○--○--○--○--○] 1 of 7: Child Identity                            |
|                                                                               |
|  Child's Preferred Name: [ Aarav                     ]                         |
|  Age Group / Age:        [ 4 yrs ────●──────── 12 yrs ] (7 years)             |
|                                                                               |
|  Choose Companion Avatar:                                                     |
|  ( 🦊 Pip )  ( 🚀 Nova )  ( 🐾 Barnaby )  ( 🎵 Lyra )  ( 🌿 Bramble )         |
|                                                                               |
|  [ Cancel ]                                            [ Continue to Tongue →]|
+-------------------------------------------------------------------------------+
|  DATA DESTINATION:                                                            |
|  -> Writes to: ChildProfile (preferred_name, age, avatar)                     |
+-------------------------------------------------------------------------------+
```

### Wireframe B: Mother Tongue & Language Bridge Selection
```
+-------------------------------------------------------------------------------+
|  LEXIGUIDE SETUP: Step 2 of 7                                  [🔊 Step Audio]|
+-------------------------------------------------------------------------------+
|  "Mother tongue acts as a warm learning bridge for supportive explanations."  |
|                                                                               |
|  +-----------------------+  +-----------------------+  +--------------------+ |
|  | 🇮🇳 తెలుగు (Telugu)    |  | 🇮🇳 हिन्दी (Hindi)     |  | 🇬🇧 English         | |
|  | "నమస్కారం!"           |  | "नमस्ते!"             |  | "Hello!"           | |
|  | [ SELECTED ✓ ]        |  | [ Select ]            |  | [ Select ]         | |
|  +-----------------------+  +-----------------------+  +--------------------+ |
|                                                                               |
|  [ ← Back ]                                            [ Continue to Target →]|
+-------------------------------------------------------------------------------+
|  DATA DESTINATION:                                                            |
|  -> Writes to: LanguageProfile (mother_tongue = "te", support_language = "te")|
+-------------------------------------------------------------------------------+
```

### Wireframe C: Interest Selection (Presentation Theming Only)
```
+-------------------------------------------------------------------------------+
|  LEXIGUIDE SETUP: Step 4 of 7                                  [🔊 Step Audio]|
+-------------------------------------------------------------------------------+
|  "Choose what makes your child smile! Shapes story worlds and plush guides."  |
|  * Note: Interests never change skill difficulty or learning assessment.      |
|                                                                               |
|  [ 🚀 Space ]*    [ 🐾 Animals ]    [ 🚗 Vehicles ]    [ 🎵 Music ]           |
|  [ 📖 Stories ]   [ 🌿 Nature ]     [ 🧚 Fantasy ]     [ ⚽ Sports ]          |
|  [ 🎨 Drawing ]   [ 🧩 Puzzles ]    [ 🌈 Colours ]                            |
|                                                                               |
|  [ ← Back ]                                            [ Continue to Comfort→]|
+-------------------------------------------------------------------------------+
|  DATA DESTINATION:                                                            |
|  -> Writes to: ChildInterest (interest_categories = ["space"])                |
|  -> Decoupled: LearningProfile is NOT modified by this choice.                |
+-------------------------------------------------------------------------------+
```

### Wireframe D: Personalized Child Home (`/child/home`)
```
+-------------------------------------------------------------------------------+
| [🧠 LexiGuide]  [🎵 Space Synth: Calm] [🔊 Voice: 0.85x]  [⭐ 342] [🦊 Aarav] |
+-------------------------------------------------------------------------------+
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | 🚀 Nova the Stargazer says:                                             |  |
|  | "Welcome to your Cosmic Station, Aarav!"              [🔊 Listen ]      |  |
|  | (Soft-shaded 3D-look astronaut plush mascot waving)                     |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  ===========================================================================  |
|  THEMED HERO ACTIVITY (Driven by Evidence: Weak Phonological Awareness)       |
|  +-------------------------------------------------------------------------+  |
|  | [ 🚀 ] "Sound Mission"                                                  |  |
|  | Presentation: Cosmic Sound Mission (Themed from Interest: Space)        |  |
|  | Learning Focus: Phonological Awareness (Driven by LearningProfile: 50%)|  |
|  | Why: Let's practice matching creature and letter sounds!                 |  |
|  | [ ▶️ PLAY (4 min) ]                               [ 🔊 Hear Details ]    |  |
|  +-------------------------------------------------------------------------+  |
|  ===========================================================================  |
|                                                                               |
|  EXPLORE YOUR COSMIC WORLD:                                                   |
|  [ 🪐 Word Planet (Word Builder) ]     [ ⭐ Star Speaker (Speak & Shine) ]    |
|                                                                               |
+-------------------------------------------------------------------------------+
|  🏠 Home     |   📖 Read     |   🔊 Sounds   |   🎮 Games    |   ⭐ Rewards     |
+-------------------------------------------------------------------------------+
```

### Wireframe E: Trace & Speak Multilingual Canvas (`/child/games/trace-speak`)
```
+-------------------------------------------------------------------------------+
| [< Back to Games]   Trace & Speak: Telugu Bridge              [🔊 Hear Target]|
+-------------------------------------------------------------------------------+
|                                                                               |
|     +-----------------------------------------+     +-----------------------+ |
|     |  Target Guide Letter:                   |     |  Word Association:    | |
|     |                                         |     |  🪷                  | |
|     |               .---1---.                 |     |  కమలం (Lotus)         | |
|     |              /         \                |     |  kamalam              | |
|     |             |     క     |               |     |  [ 🔊 Listen Again ]  | |
|     |              \         /                |     +-----------------------+ |
|     |               `---2---'                 |     |  Speech Practice:     | |
|     |                                         |     |  [ 🎤 Tap & Say ]     | |
|     |  (Tactile Canvas: Smooth Finger Line)   |     |  "Say 'కమలం' slowly"  | |
|     +-----------------------------------------+     |  Feedback: Encouraging| |
|     [ 🔄 Clear & Retry ]                            +-----------------------+ |
|                                                                               |
+-------------------------------------------------------------------------------+
```

### Wireframe F: Parent & Teacher Learning Profile Views (Evidence Only)
```
+-------------------------------------------------------------------------------+
|  PARENT LEARNING PROFILE: Aarav                                               |
+-------------------------------------------------------------------------------+
|  Personalization Overview:                                                     |
|  Theme: Cosmic Space · Guide: Nova the Stargazer · Mother Tongue: Telugu      |
|                                                                               |
|  Evidence-Based Reading Fingerprint (LearningProfile):                        |
|  - Phonological Awareness: 50%  [💪 Needs a little more practice]             |
|  - Word Recognition:       70%  [➡️ Steady progress]                          |
|  - Reading Fluency:        65%  [➡️ Steady progress]                          |
|  - Pronunciation Clarity:  75%  [📈 Improving]                                |
|  - Story Comprehension:    80%  [✨ Strong skill]                             |
|                                                                               |
|  Pacing: Unhurried · Hint Usage: 20% · Total Practice Sessions: 12            |
|                                                                               |
|  * Strictly non-clinical educational language. No diagnostic labels.          |
+-------------------------------------------------------------------------------+
```
