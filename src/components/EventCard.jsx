import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ThumbsUp, ThumbsDown, Image as ImageIcon } from 'lucide-react'
import AudioRecorder from './AudioRecorder'
import { calendarService } from '../services/calendarService'
import axios from 'axios'

// Default image if none is available
const DEFAULT_IMAGE = '/images/events/default.jpg';

// Fallback category images
const IMAGE_CATEGORY_MAP = {
  'bingo': '/images/events/bingo.jpg',
  'walk': '/images/events/walking.jpg',
  'dance': '/images/events/dance.jpg',
  'health': '/images/events/health.jpg'
};

// Fallback location images
const LOCATION_IMAGE_MAP = {
  'Community Center': '/images/locations/community-center.jpg',
  'City Park': '/images/locations/city-park.jpg',
  'Sports Complex': '/images/locations/sports-complex.jpg'
};

const getEventImage = async (event) => {
  try {
    // Primero intentar obtener la imagen personalizada de los metadatos
    const response = await axios.get(`/api/events/${event.id}/metadata`);
    const metadata = response.data;
    
    // Check if we have a custom image path
    if (metadata?.imagePath) {
      // Check if image exists (for remote S3 images we'll assume they exist)
      if (metadata.imagePath.startsWith('http')) {
        return metadata.imagePath;
      } else {
        // For local images, we should verify they exist but it's tricky in the frontend
        // Let's just return and let the img element's error handler catch it
        return metadata.imagePath;
      }
    }
    
    // If no custom image, try to use category from metadata
    if (metadata?.imageCategory) {
      return IMAGE_CATEGORY_MAP[metadata.imageCategory] || DEFAULT_IMAGE;
    }
    
    // Método antiguo: extraer categoría de la descripción
    const categoryMatch = event.description?.match(/\[CATEGORY:\s*(\w+)\]/) || 
                         event.description?.match(/#CATEGORY:(\w+)/);
    
    if (categoryMatch && categoryMatch[1] && IMAGE_CATEGORY_MAP[categoryMatch[1]]) {
      return IMAGE_CATEGORY_MAP[categoryMatch[1]];
    }
    
    // Try to get image based on location
    if (event.location && LOCATION_IMAGE_MAP[event.location]) {
      return LOCATION_IMAGE_MAP[event.location];
    }
    
    // Default fallback
    return DEFAULT_IMAGE;
  } catch (error) {
    console.error('Error getting event image:', error);
    return DEFAULT_IMAGE;
  }
};

const EventCard = ({ event, onResponseChange }) => {
  const [vote, setVote] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [eventImage, setEventImage] = useState(DEFAULT_IMAGE)
  const [eventMetadata, setEventMetadata] = useState(null)
  const [imageError, setImageError] = useState(false)
  
  useEffect(() => {
    const loadEventImage = async () => {
      try {
        // Reset image error state
        setImageError(false);
        
        // Get image URL
        const imageSrc = await getEventImage(event);
        setEventImage(imageSrc);
        
        // Also load metadata for additional info
        try {
          const metadataResponse = await axios.get(`/api/events/${event.id}/metadata`);
          setEventMetadata(metadataResponse.data);
        } catch (metadataError) {
          console.error('Error loading event metadata:', metadataError);
        }
      } catch (error) {
        console.error('Error in loadEventImage:', error);
        setEventImage(DEFAULT_IMAGE);
      }
    };
    
    loadEventImage();
  }, [event]);

  const handleImageError = () => {
    // If the image fails to load, set error state and use default image
    setImageError(true);
    setEventImage(DEFAULT_IMAGE);
  };

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
        const response = await calendarService.respondToEvent(event.id, responseType);
        
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Event Image */}
      <div className="w-full h-48 relative bg-gray-200 dark:bg-gray-700">
        {imageError ? (
          <div className="flex items-center justify-center h-full bg-blue-50 dark:bg-blue-900">
            <div className="text-center">
              <ImageIcon size={48} className="mx-auto mb-2 text-blue-300" />
              <p className="text-lg text-blue-500 dark:text-blue-300">{event.title}</p>
            </div>
          </div>
        ) : (
          <img
            src={eventImage}
            alt={`Imagen para ${event.title}`}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        )}
      </div>

      <div className="p-8">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">{event.title}</h2>
        
        <div className="space-y-4">
          <div className="flex flex-col text-xl">
            <div className="mb-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Fecha: </span>
              <span className="text-gray-900 dark:text-white">
                {format(new Date(event.date), "EEEE dd 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </div>
            
            <div className="mb-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Hora: </span>
              <span className="text-gray-900 dark:text-white">
                {format(new Date(event.date), 'h:mm a', { locale: es })}
              </span>
            </div>
            
            <div className="mb-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Lugar: </span>
              <span className="text-gray-900 dark:text-white">{event.location}</span>
            </div>
          </div>
          
          <p className="text-xl text-gray-700 dark:text-gray-300 mt-4">{event.description}</p>
          
          {/* Información adicional de los metadatos */}
          {eventMetadata?.additionalInfo && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <h3 className="text-2xl font-semibold text-blue-800 dark:text-blue-300 mb-2">Información adicional:</h3>
              <p className="text-xl text-gray-700 dark:text-gray-300">{eventMetadata.additionalInfo}</p>
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
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
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
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
              `}
            >
              <ThumbsDown size={48} strokeWidth={2.5} />
              <span className="text-xl font-semibold">¡No me gusta!</span>
            </button>
          </div>

          {vote && (
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                {vote === 'yes' 
                  ? "¡Gracias por tu respuesta positiva!" 
                  : "¡Gracias por tu respuesta!"}
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <AudioRecorder />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventCard