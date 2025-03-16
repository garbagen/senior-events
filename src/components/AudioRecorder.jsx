import React, { useState, useRef, useEffect } from 'react'
import { Mic, Square, Send, Volume2 } from 'lucide-react'

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const audioRef = useRef(null)
  
  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    
    return () => clearInterval(timerRef.current)
  }, [isRecording])
  
  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  const startRecording = async () => {
    try {
      setRecordingTime(0)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error al acceder al micrófono:', error)
      alert('No se pudo acceder al micrófono. Por favor, asegúrese de dar permiso.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const playAudio = () => {
    if (audioBlob && !isPlaying) {
      const audioURL = URL.createObjectURL(audioBlob)
      audioRef.current = new Audio(audioURL)
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
      }
      
      audioRef.current.play()
      setIsPlaying(true)
    }
  }
  
  const stopAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const sendAudio = () => {
    // Simulate sending the audio
    setShowSuccess(true)
    
    // Reset state after showing success message
    setTimeout(() => {
      setShowSuccess(false)
      setAudioBlob(null)
    }, 3000)
  }
  
  // Automatic stop recording after 2 minutes
  useEffect(() => {
    if (recordingTime >= 120) { // 2 minutes
      stopRecording()
    }
  }, [recordingTime])

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-2xl font-semibold text-gray-700 mb-2">
        ¿Preguntas sobre este evento?
      </h3>
      
      <div className="flex items-center gap-4">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
          >
            <Mic size={48} strokeWidth={2.5} />
            <span className="text-xl font-semibold">Grabar Mensaje</span>
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all animate-pulse"
          >
            <Square size={48} strokeWidth={2.5} />
            <span className="text-xl font-semibold">Detener Grabación</span>
          </button>
        )}

        {audioBlob && !showSuccess && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <button
                onClick={isPlaying ? stopAudio : playAudio}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
              >
                <Volume2 size={48} strokeWidth={2.5} />
                <span className="text-xl font-semibold">
                  {isPlaying ? 'Parar' : 'Escuchar'}
                </span>
              </button>
              
              <button
                onClick={sendAudio}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-all"
              >
                <Send size={48} strokeWidth={2.5} />
                <span className="text-xl font-semibold">Enviar Mensaje</span>
              </button>
            </div>
            
            <button
              onClick={() => setAudioBlob(null)}
              className="text-lg text-red-600 underline font-medium"
            >
              Borrar y grabar de nuevo
            </button>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-xl text-red-600 font-semibold">
              Grabando... {formatTime(recordingTime)}
            </p>
          </div>
          <p className="text-lg text-gray-600">
            Haga clic en "Detener Grabación" cuando termine.
          </p>
        </div>
      )}
      
      {showSuccess && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg text-center">
          <p className="text-xl font-semibold">¡Mensaje enviado con éxito!</p>
          <p className="text-lg">Pronto recibirá una respuesta.</p>
        </div>
      )}
    </div>
  )
}

export default AudioRecorder