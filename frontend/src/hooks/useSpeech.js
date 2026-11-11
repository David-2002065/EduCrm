import { useCallback, useEffect, useRef, useState } from 'react'
import { tokenStore } from '../api'

const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

// Brauzer ovozi uchun til kodlari (zaxira: server ovozi ishlamasa)
const BROWSER_LANGS = { uz: 'uz-UZ', en: 'en-US', ru: 'ru-RU' }
// O'zbekcha ovoz ko'p kompyuterda yo'q — lotin yozuvini turkcha ovoz ancha yaqin o'qiydi
const VOICE_FALLBACKS = { uz: ['uz', 'tr'] }

function pickVoice(voices, lang) {
  for (const p of VOICE_FALLBACKS[lang] || [lang]) {
    const voice = voices.find((v) => v.lang.toLowerCase().startsWith(p))
    if (voice) return voice
  }
  return null
}

function browserSpeak(text, lang) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    u.voice = pickVoice(synth.getVoices(), lang)
    u.lang = u.voice?.lang || BROWSER_LANGS[lang]
    u.onend = u.onerror = resolve
    synth.speak(u)
  })
}

// Server ovozi (Microsoft neyron ovozlari): matn -> mp3 havola. Bir xil gap qayta so'ralmaydi.
const clipCache = new Map()
function fetchClip(text, lang, gender) {
  const key = `${lang}|${gender}|${text}`
  if (!clipCache.has(key)) {
    const promise = fetch('/api/ai-tutor/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStore.get()}` },
      body: JSON.stringify({ text, lang, gender }),
    }).then((res) => {
      if (!res.ok) throw new Error('tts')
      return res.blob().then((b) => URL.createObjectURL(b))
    })
    promise.catch(() => clipCache.delete(key))
    clipCache.set(key, promise)
  }
  return clipCache.get(key)
}

/**
 * Ovoz bilan ishlash:
 * - listen(lang) / stop() — mikrofondan matn (brauzer, Chrome / Edge); stop() yakuniy matnni qaytaradi
 * - speak(parts, gender) — [{ text, lang: 'uz' | 'en' | 'ru' }] bo'laklarini navbat bilan o'qiydi
 */
export default function useSpeech() {
  const recRef = useRef(null)
  const textRef = useRef('')
  const doneRef = useRef(null)
  const audioRef = useRef(null)
  const playIdRef = useRef(0) // yangi gap boshlansa, eskisi to'xtaydi
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [speaking, setSpeaking] = useState(false)

  const silence = useCallback(() => {
    playIdRef.current++
    audioRef.current?.pause()
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  useEffect(
    () => () => {
      recRef.current?.abort()
      playIdRef.current++
      audioRef.current?.pause()
      window.speechSynthesis?.cancel()
    },
    [],
  )

  const listen = useCallback(
    (lang) => {
      if (!Recognition || recRef.current) return
      silence()
      const rec = new Recognition()
      rec.lang = lang
      rec.continuous = true
      rec.interimResults = true
      textRef.current = ''
      rec.onresult = (e) => {
        let finalText = ''
        let partial = ''
        for (const r of e.results) (r.isFinal ? (finalText += r[0].transcript) : (partial += r[0].transcript))
        textRef.current = finalText
        setInterim((finalText + ' ' + partial).trim())
      }
      rec.onend = () => {
        recRef.current = null
        setListening(false)
        setInterim('')
        doneRef.current?.(textRef.current.trim())
        doneRef.current = null
      }
      recRef.current = rec
      rec.start()
      setListening(true)
    },
    [silence],
  )

  // To'xtatadi va oxirgi gapni qaytaradi (brauzer yakuniy natijani biroz kechikib beradi)
  const stop = useCallback(
    () =>
      new Promise((resolve) => {
        if (!recRef.current) return resolve('')
        doneRef.current = resolve
        recRef.current.stop()
      }),
    [],
  )

  const speak = useCallback(
    async (parts, gender = 'female') => {
      silence()
      const id = playIdRef.current
      // Faqat tinish belgisidan iborat bo'laklar o'qilmaydi
      parts = parts.filter((p) => /\p{L}/u.test(p.text || ''))
      if (!parts.length) return
      setSpeaking(true)
      // Hamma bo'laklar birdaniga tayyorlanadi, o'qish esa navbat bilan
      const clips = parts.map((p) => fetchClip(p.text, p.lang, gender))
      for (let i = 0; i < parts.length; i++) {
        let url = null
        try {
          url = await clips[i]
        } catch {
          // server ovozi ishlamadi — brauzer ovozi
        }
        if (id !== playIdRef.current) return
        if (url) {
          const audio = new Audio(url)
          audioRef.current = audio
          await new Promise((resolve) => {
            audio.onended = audio.onerror = resolve
            audio.play().catch(resolve)
          })
        } else {
          await browserSpeak(parts[i].text, parts[i].lang)
        }
        if (id !== playIdRef.current) return
      }
      setSpeaking(false)
    },
    [silence],
  )

  return { supported: !!Recognition, listening, interim, speaking, listen, stop, speak, silence }
}
