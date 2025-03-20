import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ThumbsUp, ThumbsDown, Image as ImageIcon } from 'lucide-react'
import AudioRecorder from './AudioRecorder'
import { calendarService } from '../services/calendarService'
import ImageWithFallback from './ImageWithFallback'

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
    // Try to get the image path from metadata first
    console.log(`Fetching metadata for event ${event.id}`);
    const metadataResponse = await fetch(`/api/events/${event.id}/metadata`);
    if (!metadataResponse.ok) {
      console.error(`Metadata fetch failed with status: ${metadataResponse.status}`);
      throw new Error('Failed to fetch metadata');
    }
    
    const metadata = await metadataResponse.json();
    console.log('Metadata received:', metadata);
    
    // Check if we have a custom image path
    if (metadata?.imagePath) {
      console.log(`Found custom image path: ${metadata.imagePath}`);
      return {
        src: metadata.imagePath,
        fromMetadata: true,
        category: metadata.imageCategory || null
      };
    }
    
    // If no custom image, use category from metadata
    if (metadata?.imageCategory && IMAGE_CATEGORY_MAP[metadata.imageCategory]) {
      console.log(`Using category image for: ${metadata.imageCategory}`);
      return {
        src: IMAGE_CATEGORY_MAP[metadata.imageCategory],
        fromMetadata: true,
        category: metadata.imageCategory
      };
    }
    
    // Fallback to category from description
    console.log('Checking description for category');
    const categoryMatch = event.description?.match(/\[CATEGORY:\s*(\w+)\]/) || 
                         event.description?.match(/#CATEGORY:(\w+)/);
    
    if (categoryMatch && categoryMatch[1] && IMAGE_CATEGORY_MAP[categoryMatch[1]]) {
      const category = categoryMatch[1];
      console.log(`Found category in description: ${category}`);
      return {
        src: IMAGE_CATEGORY_MAP[category],
        fromDescription: true,
        category: category
      };
    }
    
    // Try to get image based on location
    if (event.location) {
      console.log(`Checking location: ${event.location}`);
      // Check for exact location match
      for (const [locationKey, imagePath] of Object.entries(LOCATION_IMAGE_MAP)) {
        if (event.location.includes(locationKey)) {
          console.log(`Found location match: ${locationKey}`);
          return {
            src: imagePath,
            fromLocation: true,
            location: locationKey
          };
        }
      }
    }
    
    // Default fallback
    console.log('No image found, using default');
    return {
      src: DEFAULT_IMAGE,
      isDefault: true
    };
  } catch (error) {
    console.error('Error getting event image:', error);
    return {
      src: DEFAULT_IMAGE,
      isDefault: true,
      error
    };
  }
};

const EventCard = ({ event, onResponseChange }) => {
  const [vote, setVote] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [eventImage, setEventImage] = useState({ src: DEFAULT_IMAGE, isDefault: true })
  const [eventMetadata, setEventMetadata] = useState(null)
  const [imageError, setImageError] = useState(false)
  
  useEffect(() => {
    const loadEventData = async () => {
      try {
        // Reset image error state
        setImageError(false);
        
        console.log("--- Event Image Debug Start ---");
        console.log("Event ID:", event.id);
        console.log("Event Title:", event.title);
        
        // Get image information
        console.log("Fetching image info...");
        const imageInfo = await getEventImage(event);
        console.log("Image info result:", imageInfo);
        
        // TEST: Verify the image exists by fetching it
        if (imageInfo.src) {
          console.log(`Testing if image exists at: ${imageInfo.src}`);
          try {
            const testFetch = await fetch(imageInfo.src, { method: 'HEAD' }).catch(e => ({ ok: false, error: e }));
            console.log(`Image fetch test result: ${testFetch.ok ? 'Success' : 'Failed'}`);
          } catch (fetchError) {
            console.error("Image fetch test error:", fetchError);
          }
        }
        
        setEventImage(imageInfo);
        
        // Also load metadata for additional info
        try {
          console.log("Fetching metadata...");
          const metadataResponse = await fetch(`/api/events/${event.id}/metadata`);
          if (metadataResponse.ok) {
            const metadataData = await metadataResponse.json();
            console.log("Metadata result:", metadataData);
            setEventMetadata(metadataData);
          } else {
            console.log("Metadata fetch failed with status:", metadataResponse.status);
          }
        } catch (metadataError) {
          console.error('Error loading event metadata:', metadataError);
        }
        
        console.log("--- Event Image Debug End ---");
      } catch (error) {
        console.error('Error in loadEventData:', error);
        setImageError(true);
        setEventImage({ src: DEFAULT_IMAGE, isDefault: true, error });
      }
    };
    
    loadEventData();
  }, [event]);

  const handleImageError = () => {
    // If the image fails to load, set error state
    console.error(`Image failed to load: ${eventImage.src}`);
    setImageError(true);
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
            retryCount={3}
            retryDelay={2000}
            placeholder={customPlaceholder}
          />
        )}
        
        {/* Optional: Show a badge for the image category if available */}
        {!imageError && eventImage.category && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {eventImage.category}
          </div>
        )}
        
        {/* Debug info badge */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Source: {eventImage.isDefault ? 'Default' : 
                  eventImage.fromMetadata ? 'Metadata' : 
                  eventImage.fromDescription ? 'Description' : 
                  eventImage.fromLocation ? 'Location' : 'Unknown'}
        </div>
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
          
          {/* Image source debugging info */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Info:</h3>
            <p className="text-sm text-yellow-700">Image Source: {eventImage.src}</p>
            <p className="text-sm text-yellow-700">
              Type: {eventImage.isDefault ? 'Default' : 
                    eventImage.fromMetadata ? 'Metadata' : 
                    eventImage.fromDescription ? 'Description' : 
                    eventImage.fromLocation ? 'Location' : 'Unknown'}
            </p>
            {eventImage.category && 
              <p className="text-sm text-yellow-700">Category: {eventImage.category}</p>
            }
            {eventImage.error && 
              <p className="text-sm text-red-700">Error: {eventImage.error.message}</p>
            }
          </div>
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