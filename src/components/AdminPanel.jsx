import React, { useState, useEffect } from 'react'
import { calendarService } from '../services/calendarService'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import EventManager from './EventManager'
import { Loader2, AlertTriangle } from 'lucide-react'

const AdminPanel = () => {
  const [events, setEvents] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('statistics') // 'statistics' or 'events'
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch events and statistics in parallel
        const [eventsData, statsResponse] = await Promise.all([
          calendarService.getEvents(),
          fetch('/api/statistics')
        ]);
        
        setEvents(eventsData)
        
        if (!statsResponse.ok) {
          throw new Error('Error al cargar estadísticas')
        }
        
        const statsData = await statsResponse.json()
        setStatistics(statsData)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError('No se pudieron cargar los datos del panel. Por favor, intente más tarde.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Prepare chart data with improved variable names
  const prepareChartData = () => {
    if (!statistics || !events) return []
    
    return events.map(event => {
      const eventStats = statistics.events[event.id] || { likes: 0, dislikes: 0, totalResponses: 0 }
      // Truncate long event titles for better display
      const displayTitle = event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title
      
      return {
        name: displayTitle,
        'Me gusta': eventStats.likes,
        'No me gusta': eventStats.dislikes
      }
    })
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-6 mx-auto" />
          <p className="text-3xl text-gray-600">Cargando datos del panel...</p>
          <p className="text-xl text-gray-500 mt-2">Por favor espere un momento</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-6 mx-auto" />
        <p className="text-2xl text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 bg-blue-600 text-white text-xl rounded-lg hover:bg-blue-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }
  
  const chartData = prepareChartData()
  
  return (
    <div className="max-w-5xl mx-auto px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Panel de Administración</h1>
      
      {/* Improved Tabs with better visual indication and larger targets */}
      <div className="flex mb-8 border-b">
        <button
          className={`px-8 py-4 text-xl font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            activeTab === 'statistics' 
              ? 'text-white bg-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('statistics')}
        >
          Estadísticas
        </button>
        <button
          className={`px-8 py-4 text-xl font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            activeTab === 'events' 
              ? 'text-white bg-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('events')}
        >
          Gestión de Eventos
        </button>
      </div>
      
      {activeTab === 'statistics' ? (
        // Statistics Tab Content
        <>
          {/* Summary cards with enhanced visibility */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Total de Respuestas</h2>
              <p className="text-5xl font-bold text-blue-600">{statistics?.totals?.totalResponses || 0}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Me gusta</h2>
              <p className="text-5xl font-bold text-green-600">{statistics?.totals?.likes || 0}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No me gusta</h2>
              <p className="text-5xl font-bold text-red-600">{statistics?.totals?.dislikes || 0}</p>
            </div>
          </div>
          
          {/* Response chart with improved readability */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Respuestas por Evento</h2>
            
            {chartData.length === 0 ? (
              <p className="text-xl text-gray-600 text-center py-12">No hay datos disponibles</p>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={90}
                      tick={{ fontSize: 14 }}
                    />
                    <YAxis tick={{ fontSize: 14 }} />
                    <Tooltip contentStyle={{ fontSize: 16 }} />
                    <Legend wrapperStyle={{ fontSize: 16, paddingTop: 20 }} />
                    <Bar dataKey="Me gusta" fill="#4ade80" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="No me gusta" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          {/* Detailed event responses table with improved visual hierarchy */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-12 overflow-x-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Detalle de Respuestas</h2>
            
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-left border text-lg">Evento</th>
                  <th className="p-4 text-center border text-lg">Me gusta</th>
                  <th className="p-4 text-center border text-lg">No me gusta</th>
                  <th className="p-4 text-center border text-lg">Total</th>
                  <th className="p-4 text-center border text-lg">Porcentaje positivo</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => {
                  const eventStats = statistics?.events?.[event.id] || { likes: 0, dislikes: 0, totalResponses: 0 }
                  const positivePercentage = eventStats.totalResponses > 0 
                    ? ((eventStats.likes / eventStats.totalResponses) * 100).toFixed(1) 
                    : 0
                  
                  // Apply visual indicators for percentage
                  let percentageColor = 'text-gray-600';
                  if (positivePercentage >= 80) percentageColor = 'text-green-600';
                  else if (positivePercentage >= 50) percentageColor = 'text-yellow-600';
                  else if (positivePercentage > 0) percentageColor = 'text-red-600';
                  
                  return (
                    <tr key={event.id} className="border hover:bg-gray-50">
                      <td className="p-4 border text-lg">{event.title}</td>
                      <td className="p-4 text-center border text-green-600 font-bold text-lg">{eventStats.likes}</td>
                      <td className="p-4 text-center border text-red-600 font-bold text-lg">{eventStats.dislikes}</td>
                      <td className="p-4 text-center border text-lg">{eventStats.totalResponses}</td>
                      <td className={`p-4 text-center border font-bold text-lg ${percentageColor}`}>{positivePercentage}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        // Events Management Tab Content
        <EventManager />
      )}
    </div>
  )
}

export default AdminPanel