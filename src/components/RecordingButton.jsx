import { useState, useRef, useEffect } from 'react'
import { Mic, Square, AlertCircle } from 'lucide-react'
import { AudioRecorder, isMediaRecorderSupported } from '../utils/audioRecorder'

export function RecordingButton({
  onStart,
  onStop,
  onError,
  size = 84,
  idleLabel = 'Tap to read aloud',
  stopLabel = '⏹ Stop',
  disabled = false,
  isRecording: externalRecording = null,
  recordingSeconds = null,
}) {
  const [internalRecording, setInternalRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [errorMsg, setErrorMsg] = useState(null)
  const recorderRef = useRef(null)
  const timerRef = useRef(null)

  const isControlled = externalRecording !== null
  const recording = isControlled ? externalRecording : internalRecording
  const displaySeconds = recordingSeconds !== null ? recordingSeconds : seconds

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recorderRef.current) recorderRef.current.cancel()
    }
  }, [])

  const startInternal = async () => {
    setErrorMsg(null)

    if (!recorderRef.current) {
      recorderRef.current = new AudioRecorder()
    }

    try {
      await recorderRef.current.start()
      setInternalRecording(true)
      setSeconds(0)
      onStart?.()

      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        setSeconds(Math.max(1, Math.round((Date.now() - startTime) / 1000)))
      }, 1000)
    } catch (err) {
      setInternalRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      let msg = 'Could not access microphone.'
      if (err.code === 'permission_denied') {
        msg = 'Microphone permission denied. Please allow microphone access.'
      } else if (err.code === 'not_found') {
        msg = 'No microphone found on this device.'
      }
      setErrorMsg(msg)
      onError?.(err)
    }
  }

  const stopInternal = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    let audioResult = null
    try {
      if (recorderRef.current && recorderRef.current.isRecording) {
        audioResult = await recorderRef.current.stop()
      }
    } catch (err) {
      onError?.(err)
    }

    setInternalRecording(false)
    const finalSeconds = audioResult?.duration || seconds
    onStop?.(finalSeconds, audioResult)
  }

  const toggle = () => {
    if (disabled) return
    if (isControlled) {
      if (!recording) {
        onStart?.()
      } else {
        onStop?.(displaySeconds)
      }
      return
    }

    if (!recording) {
      startInternal()
    } else {
      stopInternal()
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {recording && (
          <>
            <span
              className="absolute rounded-full bg-coral-400 opacity-40 animate-ping"
              style={{ width: size + 28, height: size + 28 }}
            />
            <span
              className="absolute rounded-full bg-coral-300 opacity-30 animate-pulse"
              style={{ width: size + 14, height: size + 14 }}
            />
          </>
        )}
        <button
          onClick={toggle}
          disabled={disabled}
          style={{ width: size, height: size }}
          className={`relative z-10 rounded-full flex items-center justify-center text-white shadow-xl transition-all border-4 cursor-pointer active:scale-95 ${
            disabled
              ? 'bg-slate-300 border-slate-400 cursor-not-allowed'
              : recording
              ? 'bg-[#D95C5C] border-rose-200 animate-pulse'
              : 'bg-gradient-to-br from-[#13CFE3] via-[#0899AA] to-[#08233A] border-[#DDF9FC] hover:scale-105 hover:shadow-[0_8px_30px_rgba(19,207,227,0.4)]'
          }`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          {recording ? <Square size={size * 0.34} fill="white" /> : <Mic size={size * 0.42} className="drop-shadow-xs" />}
        </button>
      </div>

      <div className="text-center">
        {recording ? (
          <div className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-rose-50 border border-rose-200 text-[#D95C5C] font-display font-bold text-xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#D95C5C] animate-ping" />
            <span>Listening closely… ({displaySeconds}s) · Tap to Stop</span>
          </div>
        ) : (
          <p className="font-display font-bold text-sm text-[#08233A] tracking-wide">
            {idleLabel}
          </p>
        )}
        {errorMsg && (
          <p className="flex items-center justify-center gap-1 text-xs text-[#D95C5C] font-semibold mt-1">
            <AlertCircle size={13} /> {errorMsg}
          </p>
        )}
      </div>
    </div>
  )
}
