import React from 'react'

const Hero = () => {
  return (
    <div className="relative bg-gray-900 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video 
          className="w-full h-full object-cover"
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/videos/fadela_pro.mp4" type="video/mp4" />
          Tu navegador no soporta el elemento de video.
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Bienvenidos a Eventos Comunitarios
          </h1>
          <p className="text-2xl text-white">
            Tu espacio para mantenerte informado sobre todas las actividades y eventos en nuestra comunidad.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Hero