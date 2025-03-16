import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Home, Bell, Menu, X, Calendar, HelpCircle, Info } from 'lucide-react'

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Handle home button click
  const handleHomeClick = () => {
    navigate('/');
    // Close any open panels
    setMenuOpen(false);
    setNotificationsOpen(false);
  };

  // Toggle notifications panel
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    // Close menu if open
    if (menuOpen) setMenuOpen(false);
  };

  // Toggle menu panel
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    // Close notifications if open
    if (notificationsOpen) setNotificationsOpen(false);
  };

  return (
    <header className="bg-[#1877F2] text-white py-2 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold">La vida es oro</span>
          </Link>
          
          {/* Icons bar */}
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 bg-white text-[#1877F2] hover:bg-gray-100 rounded-full transition-all shadow-sm" 
              aria-label="Inicio"
              onClick={handleHomeClick}
            >
              <Home size={24} strokeWidth={2.5} />
            </button>
            <button 
              className={`p-2 rounded-full transition-all shadow-sm ${
                notificationsOpen 
                  ? 'bg-white text-[#1877F2] ring-2 ring-white' 
                  : 'bg-white text-[#1877F2] hover:bg-gray-100'
              }`}
              aria-label="Notificaciones"
              onClick={toggleNotifications}
            >
              <Bell size={24} strokeWidth={2.5} />
            </button>
            <button 
              className={`p-2 rounded-full transition-all shadow-sm ${
                menuOpen 
                  ? 'bg-white text-[#1877F2] ring-2 ring-white' 
                  : 'bg-white text-[#1877F2] hover:bg-gray-100'
              }`}
              aria-label="Menú"
              onClick={toggleMenu}
            >
              {menuOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Notifications Panel */}
        {notificationsOpen && (
          <div className="absolute right-2 mt-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden text-gray-800 z-20">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold">Notificaciones</h3>
            </div>
            <div className="p-4">
              <p className="text-lg mb-2">No hay notificaciones nuevas</p>
              <button 
                className="w-full mt-2 py-2 bg-blue-100 text-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-200"
                onClick={() => setNotificationsOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Menu Panel */}
        {menuOpen && (
          <div className="absolute right-2 mt-2 w-72 bg-white rounded-lg shadow-lg overflow-hidden text-gray-800 z-20">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold">Menú</h3>
            </div>
            <div className="p-4">
              <nav className="space-y-3">
                <Link 
                  to="/" 
                  className="flex items-center p-3 hover:bg-gray-100 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <Home size={24} className="mr-3 text-blue-600" />
                  <span>Inicio</span>
                </Link>
                <Link 
                  to="/eventos" 
                  className="flex items-center p-3 hover:bg-gray-100 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <Calendar size={24} className="mr-3 text-blue-600" />
                  <span>Calendario de Eventos</span>
                </Link>
                <Link 
                  to="/ayuda" 
                  className="flex items-center p-3 hover:bg-gray-100 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <HelpCircle size={24} className="mr-3 text-blue-600" />
                  <span>Ayuda y Contacto</span>
                </Link>
                <Link 
                  to="/informacion" 
                  className="flex items-center p-3 hover:bg-gray-100 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <Info size={24} className="mr-3 text-blue-600" />
                  <span>Información</span>
                </Link>
                <Link 
                  to="/admin" 
                  className="flex items-center p-3 hover:bg-gray-100 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="mr-3 text-xs px-2 py-1 bg-gray-200 rounded-full">Admin</span>
                  <span>Panel de Administración</span>
                </Link>
              </nav>
              <button 
                className="w-full mt-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-lg font-semibold hover:bg-blue-200"
                onClick={() => setMenuOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header