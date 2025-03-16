import React, { useState, useEffect } from 'react'
import EventCard from './EventCard'
import { calendarService } from '../services/calendarService.js'
import { Loader2, CalendarDays } from 'lucide-react'

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseUpdates, setResponseUpdates] = useState({});

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const calendarEvents = await calendarService.getEvents();
        setEvents(calendarEvents);
      } catch (err) {
        setError('No se pudieron cargar los eventos. Por favor, intente más tarde.');
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleResponseChange = async (responseData) => {
    try {
      // Generate a unique ID for this response
      const userId = `user_${Date.now()}`;
      
      // Update local state to show immediate feedback
      setResponseUpdates(prev => ({
        ...prev,
        [responseData.eventId]: {
          response: responseData.response,
          timestamp: new Date().toISOString()
        }
      }));
      
      // In a real implementation, we'd send this to the backend
      console.log('Response recorded:', {
        ...responseData,
        userId
      });
      
      // If you have the backend API endpoint ready:
      // await calendarService.respondToEvent(responseData.eventId, responseData.response, userId);
    } catch (err) {
      console.error('Error handling response change:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-6" />
        <p className="text-3xl text-gray-700 mb-2">Cargando eventos...</p>
        <p className="text-xl text-gray-600">Por favor espere un momento</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <div className="text-red-500 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-3xl text-red-600 mb-4">{error}</p>
        <p className="text-xl text-gray-600 mb-8">
          No hemos podido conectar con el servidor. 
          <br />Compruebe su conexión a internet.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-8 py-4 bg-blue-600 text-white text-2xl rounded-lg hover:bg-blue-700 shadow-lg"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-8">
        <CalendarDays className="text-blue-600 mr-4" size={40} />
        <h1 className="text-5xl font-bold text-gray-900">
          Próximos Eventos
        </h1>
      </div>
      
      <p className="text-2xl text-gray-600 mb-12">
        Vea los próximos eventos y responda si está interesado
      </p>

      {events.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <p className="text-3xl text-gray-600 mb-4">No hay eventos próximos</p>
          <p className="text-xl text-gray-500">
            No hay eventos programados en este momento.
            <br />
            Por favor, vuelva a revisar más tarde.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {events.map(event => (
            <EventCard 
              key={event.id} 
              event={event}
              onResponseChange={handleResponseChange}
              userResponse={responseUpdates[event.id]?.response}
            />
          ))}
          
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <p className="text-xl text-blue-800">
              ¿No ve el evento que está buscando? 
              <br/>
              Revise más tarde, se agregan eventos regularmente.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventList