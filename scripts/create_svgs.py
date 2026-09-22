import os

OUT_DIR = os.path.abspath('public/assets/games')
os.makedirs(OUT_DIR, exist_ok=True)

images = {
    'sky-archer.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="40%" stop-color="#38bdf8"/>
      <stop offset="80%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <linearGradient id="islandGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="25%" stop-color="#16a34a"/>
      <stop offset="70%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>
    <linearGradient id="balloonRed" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>
    <linearGradient id="balloonGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    <linearGradient id="balloonPurple" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#9333ea"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#skyGrad)"/>
  
  <!-- Fluffy Cloud Layer -->
  <g fill="#ffffff" opacity="0.85">
    <circle cx="140" cy="180" r="50"/>
    <circle cx="180" cy="160" r="65"/>
    <circle cx="240" cy="180" r="55"/>
    <circle cx="660" cy="130" r="45"/>
    <circle cx="710" cy="110" r="60"/>
    <circle cx="760" cy="135" r="50"/>
    <ellipse cx="400" cy="520" rx="450" ry="100" opacity="0.6"/>
  </g>

  <!-- Floating Sky Island -->
  <path d="M 180 420 Q 320 370 540 400 Q 480 530 360 550 Q 220 530 180 420 Z" fill="url(#islandGrad)" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.3))"/>
  <ellipse cx="360" cy="410" rx="160" ry="35" fill="#4ade80"/>
  <path d="M 260 425 Q 270 480 265 520" stroke="#38bdf8" stroke-width="6" fill="none" opacity="0.85"/>
  
  <!-- Hot Air Balloons -->
  <g transform="translate(180, 200)">
    <ellipse cx="0" cy="0" rx="45" ry="55" fill="url(#balloonPurple)"/>
    <polygon points="-35,30 35,30 0,60" fill="url(#balloonPurple)"/>
    <rect x="-12" y="70" width="24" height="18" rx="4" fill="#92400e"/>
    <line x1="-15" y1="55" x2="-10" y2="70" stroke="#78350f" stroke-width="2"/>
    <line x1="15" y1="55" x2="10" y2="70" stroke="#78350f" stroke-width="2"/>
    <circle cx="0" cy="0" r="24" fill="#ffffff" opacity="0.9"/>
    <text x="0" y="8" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#6b21a8" text-anchor="middle">SH</text>
  </g>

  <g transform="translate(400, 160)" filter="url(#glow)">
    <ellipse cx="0" cy="0" rx="65" ry="80" fill="url(#balloonRed)"/>
    <polygon points="-50,45 50,45 0,90" fill="url(#balloonRed)"/>
    <rect x="-18" y="105" width="36" height="26" rx="6" fill="#92400e"/>
    <line x1="-25" y1="85" x2="-14" y2="105" stroke="#78350f" stroke-width="3"/>
    <line x1="25" y1="85" x2="14" y2="105" stroke="#78350f" stroke-width="3"/>
    <circle cx="0" cy="0" r="34" fill="#ffffff"/>
    <text x="0" y="12" font-family="system-ui, sans-serif" font-size="36" font-weight="900" fill="#b91c1c" text-anchor="middle">CH</text>
  </g>

  <g transform="translate(600, 230)">
    <ellipse cx="0" cy="0" rx="40" ry="50" fill="url(#balloonGold)"/>
    <polygon points="-30,28 30,28 0,55" fill="url(#balloonGold)"/>
    <rect x="-10" y="65" width="20" height="16" rx="4" fill="#92400e"/>
    <circle cx="0" cy="0" r="22" fill="#ffffff" opacity="0.9"/>
    <text x="0" y="8" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#854d0e" text-anchor="middle">TH</text>
  </g>

  <!-- Golden Bow and Arrow Reticle -->
  <g transform="translate(400, 480)" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.4))">
    <path d="M -90 -20 Q 0 40 90 -20" stroke="#f59e0b" stroke-width="12" fill="none" stroke-linecap="round"/>
    <line x1="-90" y1="-20" x2="90" y2="-20" stroke="#ffffff" stroke-width="3" stroke-dasharray="4 2"/>
    <line x1="0" y1="30" x2="0" y2="-80" stroke="#f8fafc" stroke-width="6" stroke-linecap="round"/>
    <polygon points="0,-95 -12,-75 12,-75" fill="#f59e0b"/>
    <circle cx="0" cy="-120" r="32" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6 6" fill="none"/>
    <circle cx="0" cy="-120" r="6" fill="#38bdf8"/>
  </g>
</svg>''',

    'cosmic-miner.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <radialGradient id="spaceBg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <linearGradient id="crystalCyan" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="50%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0e7490"/>
    </linearGradient>
    <linearGradient id="crystalPink" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="50%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#9d174d"/>
    </linearGradient>
    <linearGradient id="crystalAmber" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <filter id="glowCosmic" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#spaceBg)"/>
  
  <g fill="#ffffff">
    <circle cx="80" cy="80" r="2" opacity="0.9"/>
    <circle cx="220" cy="120" r="3" opacity="0.7"/>
    <circle cx="380" cy="60" r="1.5" opacity="0.8"/>
    <circle cx="650" cy="90" r="2.5" opacity="0.9"/>
    <circle cx="720" cy="180" r="1.5" opacity="0.6"/>
    <circle cx="150" cy="220" r="2" opacity="0.8"/>
    <circle cx="520" cy="140" r="2" opacity="0.9"/>
  </g>

  <g transform="translate(640, 120)">
    <circle cx="0" cy="0" r="55" fill="#6366f1"/>
    <ellipse cx="0" cy="0" rx="95" ry="22" fill="none" stroke="#a5b4fc" stroke-width="8" opacity="0.75" transform="rotate(-18)"/>
  </g>

  <path d="M 0 420 Q 200 370 450 410 Q 650 430 800 390 L 800 600 L 0 600 Z" fill="#1e293b"/>
  <ellipse cx="180" cy="460" rx="60" ry="18" fill="#0f172a" opacity="0.8"/>
  <ellipse cx="580" cy="480" rx="80" ry="22" fill="#0f172a" opacity="0.8"/>

  <g transform="translate(160, 310)" filter="url(#glowCosmic)">
    <polygon points="0,-80 35,-20 25,60 -25,60 -35,-20" fill="url(#crystalCyan)"/>
    <polygon points="0,-80 0,60 -25,60 -35,-20" fill="#a5f3fc" opacity="0.4"/>
    <circle cx="0" cy="0" r="22" fill="#ffffff" opacity="0.95"/>
    <text x="0" y="8" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#0891b2" text-anchor="middle">M</text>
  </g>

  <g transform="translate(400, 270)" filter="url(#glowCosmic)">
    <polygon points="0,-100 45,-25 30,80 -30,80 -45,-25" fill="url(#crystalPink)"/>
    <polygon points="0,-100 0,80 -30,80 -45,-25" fill="#fbcfe8" opacity="0.4"/>
    <circle cx="0" cy="0" r="28" fill="#ffffff" opacity="0.95"/>
    <text x="0" y="11" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="#be185d" text-anchor="middle">O</text>
  </g>

  <g transform="translate(620, 330)" filter="url(#glowCosmic)">
    <polygon points="0,-75 35,-15 22,55 -22,55 -35,-15" fill="url(#crystalAmber)"/>
    <circle cx="0" cy="0" r="22" fill="#ffffff" opacity="0.95"/>
    <text x="0" y="8" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#b45309" text-anchor="middle">N</text>
  </g>

  <g transform="translate(380, 470)" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.6))">
    <rect x="-70" y="-35" width="140" height="45" rx="14" fill="#38bdf8"/>
    <rect x="-45" y="-65" width="90" height="35" rx="12" fill="#0284c7"/>
    <ellipse cx="-5" cy="-50" rx="35" ry="20" fill="#bae6fd" opacity="0.85"/>
    <circle cx="-15" cy="-52" r="8" fill="#ffffff" opacity="0.8"/>
    <circle cx="-55" cy="20" r="25" fill="#334155" stroke="#64748b" stroke-width="8"/>
    <circle cx="55" cy="20" r="25" fill="#334155" stroke="#64748b" stroke-width="8"/>
    <polygon points="70,-10 220,-40 220,50 70,10" fill="#fef08a" opacity="0.25"/>
  </g>
</svg>''',

    'coral-diver.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="seaBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="45%" stop-color="#0369a1"/>
      <stop offset="85%" stop-color="#0c4a6e"/>
      <stop offset="100%" stop-color="#082f49"/>
    </linearGradient>
    <radialGradient id="bubbleGlow" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#a5f3fc" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.3"/>
    </radialGradient>
    <filter id="waterShine" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="800" height="600" fill="url(#seaBg)"/>

  <polygon points="120,0 260,0 350,600 180,600" fill="#ffffff" opacity="0.08"/>
  <polygon points="380,0 520,0 680,600 500,600" fill="#ffffff" opacity="0.08"/>

  <path d="M 0 490 Q 250 460 500 500 Q 680 520 800 480 L 800 600 L 0 600 Z" fill="#f59e0b" opacity="0.85"/>
  <path d="M 80 510 C 80 430, 40 400, 60 370 C 80 410, 110 430, 100 510 Z" fill="#ec4899"/>
  <path d="M 120 520 C 130 420, 180 390, 160 360 C 140 410, 140 450, 135 520 Z" fill="#a855f7"/>
  <path d="M 680 500 C 660 410, 720 380, 710 350 C 730 390, 710 450, 720 500 Z" fill="#10b981"/>
  <path d="M 730 520 C 740 440, 780 420, 770 390 C 790 420, 780 470, 760 520 Z" fill="#f43f5e"/>

  <g transform="translate(340, 310)" filter="drop-shadow(0 15px 30px rgba(0,0,0,0.5))">
    <rect x="-160" y="-12" width="25" height="24" fill="#eab308" rx="4"/>
    <ellipse cx="-165" cy="-15" rx="8" ry="18" fill="#ca8a04" transform="rotate(30 -165 -15)"/>
    <ellipse cx="-165" cy="15" rx="8" ry="18" fill="#ca8a04" transform="rotate(-30 -165 15)"/>
    <ellipse cx="0" cy="0" rx="140" ry="70" fill="#eab308"/>
    <path d="M -60 -70 Q 0 -115 40 -70 Z" fill="#ca8a04"/>
    <rect x="10" y="-130" width="16" height="65" fill="#a16207" rx="4"/>
    <rect x="10" y="-135" width="40" height="16" fill="#a16207" rx="6"/>
    <circle cx="-60" cy="0" r="26" fill="#38bdf8" stroke="#ffffff" stroke-width="6"/>
    <circle cx="10" cy="0" r="26" fill="#38bdf8" stroke="#ffffff" stroke-width="6"/>
    <circle cx="80" cy="0" r="26" fill="#38bdf8" stroke="#ffffff" stroke-width="6"/>
    <polygon points="135,0 350,-80 350,80 135,15" fill="#fef08a" opacity="0.3"/>
  </g>

  <g transform="translate(180, 160)" filter="url(#waterShine)">
    <circle cx="0" cy="0" r="42" fill="url(#bubbleGlow)" stroke="#ffffff" stroke-width="3"/>
    <ellipse cx="-12" cy="-14" rx="10" ry="5" fill="#ffffff" opacity="0.8" transform="rotate(-30 -12 -14)"/>
    <text x="0" y="8" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#0369a1" text-anchor="middle">CAT</text>
  </g>

  <g transform="translate(480, 120)" filter="url(#waterShine)">
    <circle cx="0" cy="0" r="52" fill="url(#bubbleGlow)" stroke="#ffffff" stroke-width="3.5"/>
    <ellipse cx="-16" cy="-18" rx="12" ry="6" fill="#ffffff" opacity="0.85" transform="rotate(-30 -16 -18)"/>
    <text x="0" y="10" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#0e7490" text-anchor="middle">HAT</text>
  </g>

  <g transform="translate(680, 200)" filter="url(#waterShine)">
    <circle cx="0" cy="0" r="40" fill="url(#bubbleGlow)" stroke="#ffffff" stroke-width="3"/>
    <text x="0" y="7" font-family="system-ui, sans-serif" font-size="18" font-weight="900" fill="#0369a1" text-anchor="middle">BAT</text>
  </g>
</svg>''',

    'magic-bakery.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bakeryBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdf4ff"/>
      <stop offset="50%" stop-color="#fae8ff"/>
      <stop offset="100%" stop-color="#f5d0fe"/>
    </linearGradient>
    <linearGradient id="cakePink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>
    <linearGradient id="cakeCyan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="cakeYellow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bakeryBg)"/>

  <g opacity="0.25" stroke="#d946ef" stroke-width="1">
    <line x1="0" y1="100" x2="800" y2="100"/>
    <line x1="0" y1="200" x2="800" y2="200"/>
    <line x1="0" y1="300" x2="800" y2="300"/>
    <line x1="0" y1="400" x2="800" y2="400"/>
  </g>

  <rect x="0" y="460" width="800" height="140" fill="#b45309"/>
  <rect x="0" y="450" width="800" height="20" fill="#d97706" rx="4"/>

  <g transform="translate(400, 410)">
    <ellipse cx="0" cy="20" rx="160" ry="40" fill="#b45309" opacity="0.3"/>
    <rect x="-140" y="-40" width="280" height="80" rx="20" fill="url(#cakeYellow)"/>
    <ellipse cx="0" cy="-40" rx="140" ry="30" fill="#fef08a"/>
    <path d="M -140 -35 Q -105 -15 -70 -35 Q -35 -15 0 -35 Q 35 -15 70 -35 Q 105 -15 140 -35 L 140 -40 L -140 -40 Z" fill="#ffffff"/>
    <rect x="-60" y="-15" width="120" height="35" rx="10" fill="#ffffff" opacity="0.95"/>
    <text x="0" y="10" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#854d0e" text-anchor="middle">SUN</text>
  </g>

  <g transform="translate(400, 310)">
    <rect x="-100" y="-35" width="200" height="70" rx="16" fill="url(#cakeCyan)"/>
    <ellipse cx="0" cy="-35" rx="100" ry="22" fill="#7dd3fc"/>
    <path d="M -100 -30 Q -75 -15 -50 -30 Q -25 -15 0 -30 Q 25 -15 50 -30 Q 75 -15 100 -30 L 100 -35 L -100 -35 Z" fill="#ffffff"/>
    <rect x="-55" y="-12" width="110" height="32" rx="10" fill="#ffffff" opacity="0.95"/>
    <text x="0" y="11" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#0369a1" text-anchor="middle">FLOW</text>
  </g>

  <g transform="translate(400, 220)">
    <rect x="-65" y="-30" width="130" height="60" rx="14" fill="url(#cakePink)"/>
    <ellipse cx="0" cy="-30" rx="65" ry="16" fill="#f472b6"/>
    <path d="M -65 -25 Q -45 -12 -25 -25 Q 0 -12 25 -25 Q 45 -12 65 -25 L 65 -30 L -65 -30 Z" fill="#ffffff"/>
    <rect x="-40" y="-10" width="80" height="30" rx="8" fill="#ffffff" opacity="0.95"/>
    <text x="0" y="12" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#be185d" text-anchor="middle">ER</text>
    <circle cx="0" cy="-45" r="14" fill="#ef4444"/>
    <polygon points="0,-55 -8,-45 8,-45" fill="#22c55e"/>
  </g>

  <g transform="translate(640, 150)">
    <ellipse cx="0" cy="20" rx="50" ry="18" fill="#cbd5e1"/>
    <path d="M -45 15 C -60 -20, -20 -50, 0 -30 C 20 -50, 60 -20, 45 15 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
    <rect x="-35" y="10" width="70" height="20" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3"/>
    <text x="0" y="2" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#ec4899" text-anchor="middle">MAGIC</text>
  </g>
</svg>''',

    'dino-fossil.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="desertBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fdba74"/>
      <stop offset="40%" stop-color="#fb923c"/>
      <stop offset="80%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#78350f"/>
    </linearGradient>
    <linearGradient id="sandStone" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#desertBg)"/>

  <polygon points="0,320 180,240 320,340 0,380" fill="#c2410c" opacity="0.6"/>
  <polygon points="450,330 620,220 800,310 800,390 450,370" fill="#9a3412" opacity="0.7"/>

  <path d="M 0 380 Q 400 350 800 390 L 800 600 L 0 600 Z" fill="#78350f"/>
  <rect x="100" y="330" width="600" height="220" rx="24" fill="url(#sandStone)" stroke="#92400e" stroke-width="8"/>

  <g transform="translate(400, 420)" fill="#fef3c7" stroke="#78350f" stroke-width="4">
    <path d="M -120 -40 C -80 -70, 60 -70, 110 -20 C 130 0, 120 40, 80 45 C 30 50, -30 15, -60 30 C -90 45, -130 20, -120 -40 Z"/>
    <ellipse cx="45" cy="-25" rx="22" ry="18" fill="#78350f"/>
    <ellipse cx="-35" cy="-30" rx="16" ry="12" fill="#78350f"/>
    <path d="M -90 45 C -50 65, 50 60, 95 35 C 70 80, -20 85, -90 45 Z" fill="#fde68a"/>
    <polygon points="-75,30 -68,45 -60,30" fill="#ffffff" stroke="none"/>
    <polygon points="-50,28 -43,45 -35,28" fill="#ffffff" stroke="none"/>
    <polygon points="-25,28 -18,45 -10,28" fill="#ffffff" stroke="none"/>
    <polygon points="0,25 7,42 15,25" fill="#ffffff" stroke="none"/>
    <polygon points="25,22 32,38 40,22" fill="#ffffff" stroke="none"/>
  </g>

  <g transform="translate(220, 220)">
    <rect x="-60" y="-35" width="120" height="70" rx="16" fill="#38bdf8" stroke="#0284c7" stroke-width="4"/>
    <text x="0" y="12" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">TR</text>
    <text x="0" y="-45" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">ONSET</text>
  </g>

  <g transform="translate(580, 220)">
    <rect x="-60" y="-35" width="120" height="70" rx="16" fill="#4ade80" stroke="#16a34a" stroke-width="4"/>
    <text x="0" y="12" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">EX</text>
    <text x="0" y="-45" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">RIME</text>
  </g>

  <g transform="translate(150, 480) rotate(-35)">
    <rect x="-8" y="-70" width="16" height="140" rx="6" fill="#78350f"/>
    <path d="M -45 -70 Q 0 -85 45 -70 Q 0 -55 -45 -70 Z" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
  </g>
</svg>''',

    'cloud-bouncer.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="cloudSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f472b6"/>
      <stop offset="35%" stop-color="#c084fc"/>
      <stop offset="70%" stop-color="#93c5fd"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <linearGradient id="rainbow1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="20%" stop-color="#f97316"/>
      <stop offset="40%" stop-color="#eab308"/>
      <stop offset="60%" stop-color="#22c55e"/>
      <stop offset="80%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#cloudSky)"/>

  <path d="M 40 460 A 380 340 0 0 1 760 460" stroke="url(#rainbow1)" stroke-width="32" fill="none" opacity="0.75"/>

  <g transform="translate(180, 420)">
    <ellipse cx="0" cy="0" rx="90" ry="35" fill="#ffffff" opacity="0.95"/>
    <circle cx="-40" cy="-15" r="35" fill="#ffffff"/>
    <circle cx="35" cy="-10" r="32" fill="#ffffff"/>
    <circle cx="0" cy="-25" r="40" fill="#ffffff"/>
    <text x="0" y="5" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#0284c7" text-anchor="middle">WHERE</text>
  </g>

  <g transform="translate(620, 360)">
    <ellipse cx="0" cy="0" rx="85" ry="32" fill="#ffffff" opacity="0.95"/>
    <circle cx="-35" cy="-12" r="32" fill="#ffffff"/>
    <circle cx="30" cy="-10" r="30" fill="#ffffff"/>
    <circle cx="0" cy="-22" r="38" fill="#ffffff"/>
    <text x="0" y="5" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#7c3aed" text-anchor="middle">THERE</text>
  </g>

  <g transform="translate(400, 260)">
    <ellipse cx="0" cy="0" rx="110" ry="40" fill="#ffffff" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.15))"/>
    <circle cx="-50" cy="-18" r="42" fill="#ffffff"/>
    <circle cx="45" cy="-15" r="40" fill="#ffffff"/>
    <circle cx="0" cy="-30" r="52" fill="#ffffff"/>
    <text x="0" y="8" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#db2777" text-anchor="middle">EVERY</text>
  </g>

  <g transform="translate(400, 140)">
    <ellipse cx="0" cy="90" rx="35" ry="12" fill="#94a3b8" opacity="0.4"/>
    <ellipse cx="0" cy="20" rx="34" ry="42" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
    <circle cx="0" cy="-25" r="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
    <ellipse cx="-15" cy="-70" rx="10" ry="30" fill="#ffffff" transform="rotate(-12 -15 -70)"/>
    <ellipse cx="-15" cy="-70" rx="5" ry="22" fill="#f472b6" transform="rotate(-12 -15 -70)"/>
    <ellipse cx="15" cy="-70" rx="10" ry="30" fill="#ffffff" transform="rotate(12 15 -70)"/>
    <ellipse cx="15" cy="-70" rx="5" ry="22" fill="#f472b6" transform="rotate(12 15 -70)"/>
    <circle cx="-9" cy="-28" r="3.5" fill="#1e293b"/>
    <circle cx="9" cy="-28" r="3.5" fill="#1e293b"/>
    <polygon points="0,-20 -4,-24 4,-24" fill="#f43f5e"/>
    <circle cx="-18" cy="-20" r="5" fill="#fbcfe8"/>
    <circle cx="18" cy="-20" r="5" fill="#fbcfe8"/>
    <text x="-45" y="-40" font-size="24">✨</text>
    <text x="40" y="-30" font-size="24">⭐</text>
  </g>
</svg>''',

    'voxel-crafter.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="voxelSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#voxelSky)"/>

  <g transform="translate(400, 320)">
    <polygon points="0,-120 220,-30 0,60 -220,-30" fill="#22c55e" stroke="#16a34a" stroke-width="4"/>
    <polygon points="-220,-30 0,60 0,180 -220,90" fill="#854d0e" stroke="#713f12" stroke-width="4"/>
    <polygon points="220,-30 0,60 0,180 220,90" fill="#a16207" stroke="#713f12" stroke-width="4"/>

    <g transform="translate(-110, -50)">
      <polygon points="0,-40 35,-20 0,0 -35,-20" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
      <polygon points="-35,-20 0,0 0,40 -35,20" fill="#b45309" stroke="#78350f" stroke-width="2"/>
      <polygon points="35,-20 0,0 0,40 35,20" fill="#d97706" stroke="#78350f" stroke-width="2"/>
      <text x="0" y="-14" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#78350f" text-anchor="middle">C</text>
    </g>

    <g transform="translate(0, -90)">
      <polygon points="0,-48 42,-24 0,0 -42,-24" fill="#67e8f9" stroke="#06b6d4" stroke-width="2"/>
      <polygon points="-42,-24 0,0 0,48 -42,24" fill="#0891b2" stroke="#0e7490" stroke-width="2"/>
      <polygon points="42,-24 0,0 0,48 42,24" fill="#06b6d4" stroke="#0e7490" stroke-width="2"/>
      <text x="0" y="-18" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#083344" text-anchor="middle">A</text>
    </g>

    <g transform="translate(110, -50)">
      <polygon points="0,-40 35,-20 0,0 -35,-20" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
      <polygon points="-35,-20 0,0 0,40 -35,20" fill="#a16207" stroke="#713f12" stroke-width="2"/>
      <polygon points="35,-20 0,0 0,40 35,20" fill="#ca8a04" stroke="#713f12" stroke-width="2"/>
      <text x="0" y="-14" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#713f12" text-anchor="middle">T</text>
    </g>

    <rect x="-80" y="80" width="160" height="44" rx="12" fill="#ffffff" stroke="#38bdf8" stroke-width="4"/>
    <text x="0" y="110" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#0284c7" text-anchor="middle">CAT 🐱</text>
  </g>
</svg>''',

    'safari-photo.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="savannaSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="30%" stop-color="#f97316"/>
      <stop offset="65%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#savannaSky)"/>

  <circle cx="400" cy="280" r="100" fill="#fffbeb" opacity="0.9"/>

  <g fill="#451a03">
    <path d="M 160 380 Q 155 310 160 260 Q 110 240 70 230 Q 110 210 160 220 Q 200 200 250 220 Q 210 240 170 260 Z"/>
    <rect x="155" y="260" width="10" height="140" rx="4"/>
    <path d="M 650 390 Q 645 330 650 280 Q 600 260 560 250 Q 600 230 650 240 Q 690 220 740 240 Q 700 260 660 280 Z"/>
    <rect x="645" y="280" width="10" height="120" rx="4"/>
  </g>

  <path d="M 0 400 Q 400 370 800 400 L 800 600 L 0 600 Z" fill="#78350f"/>

  <g transform="translate(260, 410)">
    <circle cx="0" cy="0" r="65" fill="#b45309"/>
    <circle cx="0" cy="0" r="45" fill="#f59e0b"/>
    <circle cx="-35" cy="-35" r="16" fill="#b45309"/>
    <circle cx="-35" cy="-35" r="8" fill="#fef3c7"/>
    <circle cx="35" cy="-35" r="16" fill="#b45309"/>
    <circle cx="35" cy="-35" r="8" fill="#fef3c7"/>
    <circle cx="-15" cy="-5" r="6" fill="#1e293b"/>
    <circle cx="15" cy="-5" r="6" fill="#1e293b"/>
    <polygon points="0,8 -8,0 8,0" fill="#78350f"/>
    <ellipse cx="0" cy="20" rx="14" ry="8" fill="#fef3c7"/>
  </g>

  <g transform="translate(540, 360)">
    <rect x="-110" y="-80" width="220" height="160" rx="24" fill="#1e293b" stroke="#64748b" stroke-width="6" filter="drop-shadow(0 15px 30px rgba(0,0,0,0.5))"/>
    <circle cx="0" cy="0" r="55" fill="#0284c7" stroke="#38bdf8" stroke-width="8"/>
    <circle cx="0" cy="0" r="35" fill="#0c4a6e"/>
    <ellipse cx="-14" cy="-14" rx="16" ry="8" fill="#ffffff" opacity="0.7" transform="rotate(-35 -14 -14)"/>
    <path d="M -90 -60 L -75 -60 L -75 -45" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <path d="M 90 -60 L 75 -60 L 75 -45" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <path d="M -90 60 L -75 60 L -75 45" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <path d="M 90 60 L 75 60 L 75 45" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <rect x="-65" y="90" width="130" height="30" rx="8" fill="#f59e0b"/>
    <text x="0" y="111" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">📸 SNAP: L-I-O-N</text>
  </g>
</svg>''',

    'ancient-labyrinth.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <radialGradient id="torchGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="30%" stop-color="#f97316"/>
      <stop offset="70%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#1c1917"/>
    </radialGradient>
    <linearGradient id="runeGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#torchGlow)"/>

  <polygon points="0,0 260,180 260,420 0,600" fill="#78350f" opacity="0.85" stroke="#451a03" stroke-width="3"/>
  <polygon points="800,0 540,180 540,420 800,600" fill="#78350f" opacity="0.85" stroke="#451a03" stroke-width="3"/>
  <polygon points="0,600 260,420 540,420 800,600" fill="#451a03" stroke="#292524" stroke-width="3"/>
  
  <rect x="310" y="190" width="180" height="230" rx="80" fill="#fef08a" opacity="0.85" filter="drop-shadow(0 0 35px #f59e0b)"/>
  <polygon points="310,420 400,200 490,420" fill="#f59e0b" opacity="0.6"/>

  <g transform="translate(180, 280)">
    <rect x="-6" y="0" width="12" height="45" rx="4" fill="#292524"/>
    <ellipse cx="0" cy="-15" rx="16" ry="24" fill="#f97316"/>
    <ellipse cx="0" cy="-12" rx="10" ry="16" fill="#fde047"/>
  </g>
  <g transform="translate(620, 280)">
    <rect x="-6" y="0" width="12" height="45" rx="4" fill="#292524"/>
    <ellipse cx="0" cy="-15" rx="16" ry="24" fill="#f97316"/>
    <ellipse cx="0" cy="-12" rx="10" ry="16" fill="#fde047"/>
  </g>

  <g transform="translate(400, 430)">
    <polygon points="-80,60 80,60 100,120 -100,120" fill="#57534e" stroke="#292524" stroke-width="4"/>
    <rect x="-65" y="-40" width="130" height="95" rx="16" fill="url(#runeGold)" stroke="#ffffff" stroke-width="5" filter="drop-shadow(0 0 25px #fde047)"/>
    <text x="0" y="15" font-family="system-ui, sans-serif" font-size="42" font-weight="900" fill="#451a03" text-anchor="middle">⚡ 𓃭 ⚡</text>
    <text x="0" y="42" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#78350f" text-anchor="middle">PHONICS KEYSTONE</text>
  </g>
</svg>'''
}

for name, content in images.items():
    p = os.path.join(OUT_DIR, name)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f"Generated {name} ({len(content)} bytes)")
