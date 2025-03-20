import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import AudioRecorder from './AudioRecorder'
import { calendarService } from '../services/calendarService'

const EventCard = ({ event, onResponseChange }) => {
  const [vote, setVote] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [eventMetadata, setEventMetadata] = useState(null)
  
  useEffect(() => {
    const loadEventData = async () => {
      try {
        // Get metadata for the event
        const metadataResponse = await fetch(`/api/events/${event.id}/metadata`);
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          setEventMetadata(metadata);
        }
      } catch (error) {
        console.error('Error loading event data:', error);
      }
    };
    
    loadEventData();
  }, [event]);

  const handleVote = async (newVote) => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      
      // Toggle vote off if clicking the same option
      const finalVote = vote === newVote ? null : newVote;
      setVote(finalVote);
      
      if (finalVote) {
        // Map yes/no to like/dislike for the API
        const responseType = finalVote === 'yes' ? 'like' : 'dislike';
        
        // Send response to server
        await calendarService.respondToEvent(event.id, responseType);
        
        // Notify parent component if needed
        if (onResponseChange) {
          onResponseChange({
            eventId: event.id,
            responseType,
            success: true
          });
        }
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Only show image if one exists */}
      {eventMetadata?.imagePath && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={eventMetadata.imagePath}
            alt={`Imagen para ${event.title}`}
            className="w-full h-full object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}

      <div className="p-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">{event.title}</h2>
        
        <div className="space-y-4">
          <div className="flex flex-col text-xl">
            <div className="mb-4">
              <span className="font-semibold text-gray-700">Fecha: </span>
              <span className="text-gray-900">
                {format(new Date(event.date), "EEEE dd 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
            
            <div className="mb-4">
              <span className="font-semibold text-gray-700">Hora: </span>
              <span className="text-gray-900">
                {format(new Date(event.date), 'h:mm a', { locale: es })}
              </span>
            </div>
            
            <div className="mb-4">
              <span className="font-semibold text-gray-700">Lugar: </span>
              <span className="text-gray-900">{event.location}</span>
            </div>
          </div>
          
          <p className="text-xl text-gray-700 mt-4">{event.description}</p>
          
          {/* Información adicional de los metadatos */}
          {eventMetadata?.additionalInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-2xl font-semibold text-blue-800 mb-2">Información adicional:</h3>
              <p className="text-xl text-gray-700">{eventMetadata.additionalInfo}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-8">
          <div className="flex gap-6 justify-center">
            <button
              onClick={() => handleVote('yes')}
              disabled={submitting}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg
                transition-all duration-200
                ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
                ${vote === 'yes' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              <ThumbsUp size={48} strokeWidth={2.5} />
              <span className="text-xl font-semibold">¡Me gusta!</span>
            </button>

            <button
              onClick={() => handleVote('no')}
              disabled={submitting}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg
                transition-all duration-200
                ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
                ${vote === 'no' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              <ThumbsDown size={48} strokeWidth={2.5} />
              <span className="text-xl font-semibold">¡No me gusta!</span>
            </button>
          </div>

          {vote && (
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-700">
                {vote === 'yes' 
                  ? "¡Gracias por tu respuesta positiva!" 
                  : "¡Gracias por tu respuesta!"}
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-8">
            <AudioRecorder />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventCard