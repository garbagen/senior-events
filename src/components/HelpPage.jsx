import React from 'react'
import { Phone, Mail, MapPin, Clock, Info, ExternalLink } from 'lucide-react'

const HelpPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-5xl font-bold text-gray-900 mb-8">Ayuda y Contacto</h1>
      
      {/* Contact Information Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <Info className="mr-3 text-blue-600" size={32} />
          Directorio de Contacto
        </h2>
        
        <div className="space-y-8">
          {/* Phone */}
          <div className="flex">
            <div className="mr-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <Phone size={36} className="text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">Teléfono</h3>
              <p className="text-2xl text-blue-600 font-semibold">900 123 456</p>
              <p className="text-lg text-gray-600 mt-1">Lunes a Viernes, 9:00 - 18:00</p>
            </div>
          </div>
          
          {/* Email */}
          <div className="flex">
            <div className="mr-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <Mail size={36} className="text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">Correo Electrónico</h3>
              <p className="text-2xl text-blue-600 font-semibold">info@areadelmayorlugarb.es</p>
              <p className="text-lg text-gray-600 mt-1">Respondemos en 24-48 horas</p>
            </div>
          </div>
          
          {/* Office Hours */}
          <div className="flex">
            <div className="mr-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <Clock size={36} className="text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">Horario de Atención</h3>
              <div className="text-lg text-gray-600">
                <p className="mb-1"><strong>Lunes a Viernes:</strong> 9:00 - 18:00</p>
                <p><strong>Sábados:</strong> 10:00 - 14:00 (Solo en oficina principal)</p>
              </div>
            </div>
          </div>
          
          {/* Address */}
          <div className="flex">
            <div className="mr-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <MapPin size={36} className="text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">Dirección</h3>
              <p className="text-xl text-gray-600">
                Centro de Atención al Mayor "Vida Activa"<br />
                Calle Principal 123<br />
                28001 Madrid
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <MapPin className="mr-3 text-blue-600" size={32} />
          Área del Mayor
        </h2>
        
        <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
          {/* This is a placeholder for the map - in a real application, you would integrate Google Maps or another mapping service */}
          <div className="bg-gray-200 w-full h-80 rounded-lg flex items-center justify-center mb-4">
            <div className="text-center">
              <MapPin size={64} className="text-blue-600 inline-block mb-4" />
              <p className="text-xl text-gray-600">Mapa del Área del Mayor</p>
              <p className="text-lg text-gray-500 mt-2">(Vista previa del mapa)</p>
            </div>
          </div>
          
          <div className="text-center">
            <a 
              href="https://maps.google.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-xl rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <span>Ver mapa completo</span>
              <ExternalLink size={20} className="ml-2" />
            </a>
          </div>
        </div>
        
        {/* Text directions */}
        <div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">Cómo llegar:</h3>
          <div className="space-y-3 text-lg text-gray-600">
            <p>
              <strong className="text-blue-600">En metro:</strong> Líneas 1, 4 y 7 - Estación "Centro Mayor" (salida norte)
            </p>
            <p>
              <strong className="text-blue-600">En autobús:</strong> Líneas 14, 27 y 45 - Parada "Centro Comunitario"
            </p>
            <p>
              <strong className="text-blue-600">En coche:</strong> Parking público disponible en el subterráneo del centro
            </p>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Preguntas Frecuentes</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">¿Cómo me inscribo a un evento?</h3>
            <p className="text-xl text-gray-600">Para inscribirse a un evento, pulse el botón "¡Me interesa!" en la tarjeta del evento. Un organizador se pondrá en contacto con usted.</p>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">¿Necesito registrarme para asistir a los eventos?</h3>
            <p className="text-xl text-gray-600">No es necesario registrarse para asistir a la mayoría de eventos, pero recomendamos indicar su interés para recibir recordatorios y actualizaciones.</p>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">¿Cómo puedo contactar con un organizador directamente?</h3>
            <p className="text-xl text-gray-600">Puede grabar un mensaje de voz usando el botón "Grabar Mensaje" en la tarjeta del evento o llamar directamente al teléfono de contacto: 900 123 456.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpPage