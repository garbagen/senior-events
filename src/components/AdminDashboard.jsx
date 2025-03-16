import React, { useState, useEffect } from 'react'
import { calendarService } from '../services/calendarService'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const AdminDashboard = () => {
  const [events, setEvents] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch events and all event responses
        const [eventsData, statsData] = await Promise.all([
          calendarService.getEvents(),
          fetch('/api/statistics').then(res => res.json())
        ])
        
        setEvents(eventsData)
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
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!statistics || !events) return []
    
    return events.map(event => {
      const eventStats = statistics.events[event.id] || { likes: 0, dislikes: 0, totalResponses: 0 }
      return {
        name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
        likes: eventStats.likes,
        dislikes: eventStats.dislikes
      }
    })
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-2xl text-gray-600">Cargando datos del panel...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <p className="text-2xl text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 bg-blue-600 text-white text-xl rounded-lg hover:bg-blue-700"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }
  
  const chartData = prepareChartData()
  
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-5xl font-bold text-gray-900 mb-8">Panel de Administración</h1>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Total de Respuestas</h2>
          <p className="text-5xl font-bold text-blue-600">{statistics?.totals?.totalResponses || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Me gusta</h2>
          <p className="text-5xl font-bold text-green-600">{statistics?.totals?.likes || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No me gusta</h2>
          <p className="text-5xl font-bold text-red-600">{statistics?.totals?.dislikes || 0}</p>
        </div>
      </div>
      
      {/* Response chart */}
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
                  height={80}
                  tick={{ fontSize: 14 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="likes" name="Me gusta" fill="#4ade80" />
                <Bar dataKey="dislikes" name="No me gusta" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      {/* Detailed event responses table */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-12 overflow-x-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Detalle de Respuestas</h2>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-4 text-left border">Evento</th>
              <th className="p-4 text-center border">Me gusta</th>
              <th className="p-4 text-center border">No me gusta</th>
              <th className="p-4 text-center border">Total</th>
              <th className="p-4 text-center border">Porcentaje positivo</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => {
              const eventStats = statistics.events[event.id] || { likes: 0, dislikes: 0, totalResponses: 0 }
              const positivePercentage = eventStats.totalResponses > 0 
                ? ((eventStats.likes / eventStats.totalResponses) * 100).toFixed(1) 
                : 0
              
              return (
                <tr key={event.id} className="border hover:bg-gray-50">
                  <td className="p-4 border">{event.title}</td>
                  <td className="p-4 text-center border text-green-600 font-bold">{eventStats.likes}</td>
                  <td className="p-4 text-center border text-red-600 font-bold">{eventStats.dislikes}</td>
                  <td className="p-4 text-center border">{eventStats.totalResponses}</td>
                  <td className="p-4 text-center border">{positivePercentage}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard