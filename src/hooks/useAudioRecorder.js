// ============================================================
// USE AUDIO RECORDER HOOK
// ------------------------------------------------------------
// React hook encapsulating browser microphone recording lifecycle,
// elapsed duration timing, error handling, and track cleanup on unmount.
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { AudioRecorder, isMediaRecorderSupported } from '../utils/audioRecorder'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('idle') // idle | requesting | granted | denied | unsupported
  const [audioResult, setAudioResult] = useState(null)

  const recorderRef = useRef(null)
  const timerRef = useRef(null)

  if (!recorderRef.current) {
    recorderRef.current = new AudioRecorder()
  }

  // Cleanup on component unmount: release all microphone tracks immediately
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recorderRef.current) {
        recorderRef.current.cancel()
      }
    }
  }, [])

  const startRecording = useCallback(async (options = {}) => {
    setError(null)
    setAudioResult(null)
    setDuration(0)
    setPermissionStatus('requesting')

    try {
      const startInfo = await recorderRef.current.start(options)
      setIsRecording(true)
      setPermissionStatus('granted')

      // Track elapsed duration in whole seconds
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.max(1, Math.round((Date.now() - startTime) / 1000)))
      }, 1000)

      return startInfo
    } catch (err) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsRecording(false)
      if (err.code === 'permission_denied') {
        setPermissionStatus('denied')
      } else if (err.code === 'unsupported') {
        setPermissionStatus('unsupported')
      } else {
        setPermissionStatus('error')
      }
      setError(err)
      throw err
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    try {
      const result = await recorderRef.current.stop()
      setIsRecording(false)
      setAudioResult(result)
      setDuration(result.duration)
      return result
    } catch (err) {
      setIsRecording(false)
      setError(err)
      throw err
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recorderRef.current) {
      recorderRef.current.cancel()
    }
    setIsRecording(false)
    setDuration(0)
    setAudioResult(null)
  }, [])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isRecording,
    duration,
    error,
    permissionStatus,
    audioResult,
    audioBlob: audioResult?.blob || null,
    startRecording,
    stopRecording,
    cancelRecording,
    resetError,
    isSupported: isMediaRecorderSupported(),
  }
}
