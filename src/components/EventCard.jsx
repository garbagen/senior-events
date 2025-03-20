import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ThumbsUp, ThumbsDown, Image as ImageIcon } from 'lucide-react'
import AudioRecorder from './AudioRecorder'
import { calendarService } from '../services/calendarService'
import ImageWithFallback from './ImageWithFallback'

// Built-in SVG data URL for default image - this avoids the need for external files
const DEFAULT_IMAGE_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f3f4f6'/%3E%3Cpath d='M400 150 L600 450 L200 450 Z' fill='%23e5e7eb'/%3E%3Ccircle cx='600' cy='150' r='80' fill='%23fcd34d'/%3E%3C/svg%3E`;

// Fallback category images - using inline SVG data URLs to avoid external file dependencies
const IMAGE_CATEGORY_MAP = {
  'bingo': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23fee2e2'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='72' fill='%23ef4444' text-anchor='middle'%3EBINGO%3C/text%3E%3C/svg%3E`,
  'walk': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23ecfdf5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='72' fill='%2310b981' text-anchor='middle'%3EPASEO%3C/text%3E%3C/svg%3E`,
  'dance': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23ede9fe'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='72' fill='%238b5cf6' text-anchor='middle'%3EBAILE%3C/text%3E%3C/svg%3E`,
  'health': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23dbeafe'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='72' fill='%232563eb' text-anchor='middle'%3ESALUD%3C/text%3E%3C/svg%3E`
};

// Fallback location images - using inline SVG data URLs
const LOCATION_IMAGE_MAP = {
  'Centro Comunitario': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f0fdf4'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='48' fill='%2316a34a' text-anchor='middle'%3ECENTRO COMUNITARIO%3C/text%3E%3C/svg%3E`,
  'Parque': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23ecfdf5'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='72' fill='%2310b981' text-anchor='middle'%3EPARQUE%3C/text%3E%3C/svg%3E`,
  'Salón': `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23fff7ed'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='72' fill='%23f97316' text-anchor='middle'%3ESALÓN%3C/text%3E%3C/svg%3E`
};

const getEventImage = async (event) => {
  try {
    // Try to get the image path from metadata first
    const metadataResponse = await fetch(`/api/events/${event.id}/metadata`);
    if (!metadataResponse.ok) {
      throw new Error('Failed to fetch metadata');
    }
    
    const metadata = await metadataResponse.json();
    
    // Check if we have a custom image path
    if (metadata?.imagePath) {
      // Only use imagePath if it's not a local path that might not exist
      // or if it's an absolute URL (starts with http or https)
      if (metadata.imagePath.startsWith('http') || metadata.imagePath.startsWith('/uploads/')) {
        return {
          src: metadata.imagePath,
          fromMetadata: true,
          category: metadata.imageCategory || null
        };
      }
    }
    
    // If no custom image, use category from metadata
    if (metadata?.imageCategory && IMAGE_CATEGORY_MAP[metadata.imageCategory]) {
      return {
        src: IMAGE_CATEGORY_MAP[metadata.imageCategory],
        fromMetadata: true,
        category: metadata.imageCategory
      };
    }
    
    // Fallback to category from description
    const categoryMatch = event.description?.match(/\[CATEGORY:\s*(\w+)\]/) || 
                         event.description?.match(/#CATEGORY:(\w+)/);
    
    if (categoryMatch && categoryMatch[1] && IMAGE_CATEGORY_MAP[categoryMatch[1]]) {
      const category = categoryMatch[1];
      return {
        src: IMAGE_CATEGORY_MAP[category],
        fromDescription: true,
        category: category
      };
    }
    
    // Try to get image based on location
    if (event.location) {
      // Check for location matches
      for (const [locationKey, imagePath] of Object.entries(LOCATION_IMAGE_MAP)) {
        if (event.location.toLowerCase().includes(locationKey.toLowerCase())) {
          return {
            src: imagePath,
            fromLocation: true,
            location: locationKey
          };
        }
      }
    }
    
    // Default fallback - use the SVG data URL
    return {
      src: DEFAULT_IMAGE_SVG,
      isDefault: true
    };
  } catch (error) {
    console.error('Error getting event image:', error);
    return {
      src: DEFAULT_IMAGE_SVG,
      isDefault: true,
      error
    };
  }
};

const EventCard = ({ event, onResponseChange }) => {
  const [vote, setVote] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [eventImage, setEventImage] = useState({ src: DEFAULT_IMAGE_SVG, isDefault: true })
  const [eventMetadata, setEventMetadata] = useState(null)
  const [imageError, setImageError] = useState(false)
  
  useEffect(() => {
    const loadEventData = async () => {
      try {
        // Reset image error state
        setImageError(false);
        
        // Get image information
        const imageInfo = await getEventImage(event);
        setEventImage(imageInfo);
        
        // Also load metadata for additional info
        try {
          const metadataResponse = await fetch(`/api/events/${event.id}/metadata`);
          if (metadataResponse.ok) {
            const metadataData = await metadataResponse.json();
            setEventMetadata(metadataData);
          }
        } catch (metadataError) {
          console.error('Error loading event metadata:', metadataError);
        }
      } catch (error) {
        console.error('Error in loadEventData:', error);
        setImageError(true);
        setEventImage({ src: DEFAULT_IMAGE_SVG, isDefault: true, error });
      }
    };
    
    loadEventData();
  }, [event]);

  const handleImageError = () => {
    // If the image fails to load, set error state and use default image
    console.warn(`Image failed to load: ${eventImage.src}`);
    setImageError(true);
    setEventImage(prev => ({ ...prev, src: DEFAULT_IMAGE_SVG, hasError: true }));
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

  // Create a custom placeholder based on event info for image errors
  const customPlaceholder = (
    <div className="flex items-center justify-center h-full w-full bg-blue-50">
      <div className="text-center p-4">
        <ImageIcon size={48} className="mx-auto mb-2 text-blue-300" />
        <p className="text-lg font-medium text-blue-500">{event.title}</p>
        <p className="text-sm text-blue-400">
          {new Date(event.date).toLocaleDateString()}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Event Image */}
      <div className="w-full h-48 relative bg-gray-200 overflow-hidden">
        {imageError ? (
          customPlaceholder
        ) : (
          <ImageWithFallback
            src={eventImage.src}
            alt={`Imagen para ${event.title}`}
            className="w-full h-full object-cover"
            onError={handleImageError}
            retryCount={2}
            retryDelay={1000}
            placeholder={customPlaceholder}
          />
        )}
        
        {/* Optional: Show a badge for the image category if available */}
        {!imageError && eventImage.category && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {eventImage.category}
          </div>
        )}
      </div>

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