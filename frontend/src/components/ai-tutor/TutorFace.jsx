// AI ustoz "Zukko" — kayfiyatiga qarab rangi, ko'zi va og'zi o'zgaradi.
// emotion: calm | happy | love | proud | thinking | sad | angry
// state:   idle | listening | thinking | speaking

const MOODS = {
  calm: { color: '#3fbf73', glow: '#7cf29a' },
  happy: { color: '#f2a516', glow: '#ffd66b' },
  love: { color: '#ec4f8f', glow: '#ff9cc4' },
  proud: { color: '#e0a100', glow: '#ffe066' },
  thinking: { color: '#4b7bec', glow: '#9db8ff' },
  sad: { color: '#8e7cc3', glow: '#c9bdf0' },
  angry: { color: '#e5482f', glow: '#ff9a7a' },
}

const INK = '#1b1d1b'

function Eyes({ emotion }) {
  const eye = (x) => {
    switch (emotion) {
      case 'love':
        return <path key={x} d={`M${x} 104c-9-7-14-12-14-18a7 7 0 0 1 14-3 7 7 0 0 1 14 3c0 6-5 11-14 18z`} fill="#ec4f8f" />
      case 'happy':
      case 'proud':
        return <path key={x} d={`M${x - 10} 96q10-14 20 0`} stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />
      case 'calm':
        return <path key={x} d={`M${x - 10} 92q10 10 20 0`} stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />
      case 'sad':
        return <ellipse key={x} cx={x} cy="96" rx="6" ry="8" fill={INK} />
      default:
        return <ellipse key={x} cx={x} cy="92" rx="7" ry="9" fill={INK} />
    }
  }
  return (
    <>
      {eye(76)}
      {eye(124)}
      {emotion === 'angry' && (
        <path d="M60 72l26 10M140 72l-26 10" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      )}
      {emotion === 'sad' && (
        <>
          <path d="M62 80l22-6M138 80l-22-6" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M128 108q4 8 0 12q-4-4 0-12z" fill="#7fb6ff" />
        </>
      )}
      {emotion === 'thinking' && <path d="M112 74l24-4" stroke={INK} strokeWidth="5" strokeLinecap="round" />}
    </>
  )
}

function Mouth({ emotion, talking }) {
  const cls = talking ? 'tutor-talk' : ''
  const shapes = {
    calm: <path d="M90 122q10 8 20 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />,
    happy: <path d="M84 118q16 22 32 0z" fill={INK} />,
    proud: <path d="M82 116q18 26 36 0z" fill={INK} />,
    love: <ellipse cx="100" cy="124" rx="6" ry="7" fill={INK} />,
    thinking: <path d="M92 126q10-4 22 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />,
    sad: <path d="M88 130q12-12 24 0" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />,
    angry: <path d="M84 128l8-6 8 6 8-6 8 6" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  }
  return (
    <g className={cls} style={{ transformOrigin: '100px 124px' }}>
      {shapes[emotion]}
    </g>
  )
}

function Extras({ emotion, color }) {
  if (emotion === 'proud')
    return (
      <g fill="#ffd23f" className="tutor-twinkle">
        <path d="M26 54l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
        <path d="M172 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path d="M178 140l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      </g>
    )
  if (emotion === 'angry')
    return (
      <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" className="tutor-steam">
        <path d="M30 70q-8-10 0-20t0-20" />
        <path d="M170 70q8-10 0-20t0-20" />
      </g>
    )
  if (emotion === 'love')
    return (
      <g fill="#ff7fb0" className="tutor-twinkle">
        <path d="M168 50c-5-4-8-7-8-10a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 3-3 6-8 10z" />
        <path d="M34 64c-4-3-6-5-6-8a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 3-2 5-6 8z" />
      </g>
    )
  if (emotion === 'thinking')
    return (
      <g fill={color} className="tutor-dots">
        <circle cx="158" cy="44" r="5" />
        <circle cx="172" cy="30" r="7" />
        <circle cx="190" cy="12" r="9" />
      </g>
    )
  return null
}

export default function TutorFace({ emotion = 'calm', state = 'idle', size = 220 }) {
  const mood = MOODS[emotion] || MOODS.calm
  const shownEmotion = state === 'thinking' ? 'thinking' : emotion
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* Orqadagi nur: tinglayotganda pulsatsiya qiladi */}
      <div
        className={`absolute inset-6 rounded-full blur-2xl transition-colors duration-500 ${state === 'listening' ? 'tutor-pulse' : 'opacity-60'}`}
        style={{ background: mood.glow }}
      />
      <svg viewBox="0 0 200 200" width={size} height={size} className={`relative ${state === 'speaking' ? 'tutor-bounce' : 'tutor-float'}`}>
        <ellipse cx="100" cy="188" rx="56" ry="7" fill="#0b0c0b" opacity="0.12" />
        {/* Boshidagi nihol */}
        <path d="M100 46V30" stroke={mood.color} strokeWidth="6" strokeLinecap="round" />
        <path d="M100 32q-18-4-22-18q18 0 22 18zM100 32q18-4 22-18q-18 0-22 18z" fill={mood.color} />
        <rect
          x="34"
          y="44"
          width="132"
          height="128"
          rx={emotion === 'angry' ? 36 : 54}
          fill="#ffffff"
          stroke={mood.color}
          strokeWidth="9"
          style={{ transition: 'stroke .4s, rx .4s' }}
        />
        {/* Yonoqlar */}
        <ellipse cx="62" cy="116" rx="9" ry="5" fill={mood.glow} opacity="0.7" />
        <ellipse cx="138" cy="116" rx="9" ry="5" fill={mood.glow} opacity="0.7" />
        <Eyes emotion={shownEmotion} />
        <Mouth emotion={shownEmotion} talking={state === 'speaking'} />
        <Extras emotion={shownEmotion} color={mood.color} />
      </svg>
    </div>
  )
}
