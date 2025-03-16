import React from 'react';
import { Phone, Mail, MapPin, Clock, Info, Bus } from 'lucide-react';

const Information = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Main Sections */}
      <div className="space-y-8">
        {/* Contact Info */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Info size={32} className="text-blue-600" />
            Información de Contacto
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-2xl">
              <Phone className="text-blue-600 flex-shrink-0" size={28} />
              <div>
                <p className="font-semibold">Teléfono:</p>
                <p>123-456-789</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-2xl">
              <Mail className="text-blue-600 flex-shrink-0" size={28} />
              <div>
                <p className="font-semibold">Correo:</p>
                <p>centro@comunidad.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-2xl">
              <MapPin className="text-blue-600 flex-shrink-0" size={28} />
              <div>
                <p className="font-semibold">Dirección:</p>
                <p>Calle Principal 123, Ciudad</p>
              </div>
            </div>
          </div>
        </section>

        {/* Opening Hours */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Clock size={32} className="text-blue-600" />
            Horario del Centro
          </h2>
          
          <div className="space-y-3 text-2xl">
            <p><span className="font-semibold">Lunes a Viernes:</span> 9:00 - 20:00</p>
            <p><span className="font-semibold">Sábados:</span> 10:00 - 14:00</p>
            <p><span className="font-semibold">Domingos:</span> Cerrado</p>
          </div>
        </section>

        {/* Transportation */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Bus size={32} className="text-blue-600" />
            Cómo Llegar
          </h2>
          
          <div className="space-y-4 text-2xl">
            <div>
              <p className="font-semibold">Autobuses:</p>
              <p>Líneas 1, 4, y 7 - Parada "Centro Comunitario"</p>
            </div>
            
            <div>
              <p className="font-semibold">Estacionamiento:</p>
              <p>Disponible gratuitamente para miembros</p>
            </div>
          </div>
        </section>

        {/* Additional Information */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Información Adicional
          </h2>
          
          <div className="space-y-4 text-2xl">
            <div>
              <p className="font-semibold">Membresía:</p>
              <p>Gratuita para residentes mayores de 65 años</p>
            </div>
            
            <div>
              <p className="font-semibold">Servicios:</p>
              <ul className="list-disc pl-8 space-y-2">
                <li>Actividades recreativas</li>
                <li>Grupos de ejercicio</li>
                <li>Talleres culturales</li>
                <li>Servicio de cafetería</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Information;