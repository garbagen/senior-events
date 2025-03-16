import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday,
  isSameMonth,
  parseISO,
  isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarService } from '../services/calendarService';

const MonthCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const calendarEvents = await calendarService.getEvents();
        setEvents(calendarEvents);
      } catch (err) {
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const getDayEvents = (day) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, day);
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={prevMonth}
          className="p-2 sm:p-4 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={32} className="text-blue-600" />
        </button>
        
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-2 sm:p-4 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={32} className="text-blue-600" />
        </button>
      </div>

      {loading ? (
        <div className="text-2xl text-center py-12 text-gray-600">
          Cargando eventos...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Day Names */}
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="text-base sm:text-xl font-semibold text-gray-600 text-center p-2">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map(day => {
              const dayEvents = getDayEvents(day);
              const hasEvents = dayEvents.length > 0;
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(selectedDay && isSameDay(day, selectedDay) ? null : day)}
                  className={`
                    aspect-square p-1 sm:p-2 text-left relative
                    ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
                    ${hasEvents ? 'bg-green-100 hover:bg-green-200' : 'hover:bg-gray-50'}
                    ${isToday(day) ? 'ring-2 ring-blue-500' : ''}
                    transition-colors
                  `}
                >
                  <span className={`
                    text-lg sm:text-2xl font-medium
                    ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {hasEvents && (
                    <div className="mt-1">
                      <div className="text-xs sm:text-sm font-medium text-green-800">
                        {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Events */}
          {selectedDay && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-xl sm:text-2xl font-bold mb-4">
                {format(selectedDay, "d 'de' MMMM", { locale: es })}
              </h3>
              
              <div className="space-y-2">
                {getDayEvents(selectedDay).map(event => (
                  <div 
                    key={event.id}
                    className="p-3 sm:p-4 bg-green-50 rounded-lg"
                  >
                    <div className="text-lg sm:text-xl font-semibold">
                      {event.title}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600">
                      {format(parseISO(event.date), 'HH:mm')} - {event.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthCalendar;