import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Home, Bell, Menu, X, Calendar, HelpCircle, Info, Moon, Sun } from 'lucide-react'

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

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

  // Manual toggle for dark mode (for demonstration)
  const toggleDarkMode = () => {
    // This is just a visual toggle - in a real app you'd want to 
    // actually adjust the system preference or store in localStorage
    setDarkMode(!darkMode);
    
    // Just for demonstration - shows an alert explaining this feature
    alert('Esta función es solo para demostración. En una aplicación real, deberías cambiar el tema de tu dispositivo.');
  };

  return (
    <header className="bg-[#1877F2] dark:bg-blue-900 text-white py-2 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold">La vida es oro</span>
          </Link>
          
          {/* Icons bar */}
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 bg-white dark:bg-gray-800 text-[#1877F2] dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all shadow-sm" 
              aria-label="Inicio"
              onClick={handleHomeClick}
            >
              <Home size={24} strokeWidth={2.5} />
            </button>
            <button 
              className={`p-2 rounded-full transition-all shadow-sm ${
                notificationsOpen 
                  ? 'bg-white dark:bg-gray-800 text-[#1877F2] dark:text-blue-300 ring-2 ring-white dark:ring-gray-600' 
                  : 'bg-white dark:bg-gray-800 text-[#1877F2] dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label="Notificaciones"
              onClick={toggleNotifications}
            >
              <Bell size={24} strokeWidth={2.5} />
            </button>
            <button 
              className={`p-2 rounded-full transition-all shadow-sm ${
                menuOpen 
                  ? 'bg-white dark:bg-gray-800 text-[#1877F2] dark:text-blue-300 ring-2 ring-white dark:ring-gray-600' 
                  : 'bg-white dark:bg-gray-800 text-[#1877F2] dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
          <div className="absolute right-2 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden text-gray-800 dark:text-white z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold">Notificaciones</h3>
            </div>
            <div className="p-4">
              <p className="text-lg mb-2">No hay notificaciones nuevas</p>
              <button 
                className="w-full mt-2 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg text-lg font-semibold hover:bg-blue-200 dark:hover:bg-blue-800"
                onClick={() => setNotificationsOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Menu Panel */}
        {menuOpen && (
          <div className="absolute right-2 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden text-gray-800 dark:text-white z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold">Menú</h3>
            </div>
            <div className="p-4">
              <nav className="space-y-3">
                <Link 
                  to="/" 
                  className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <Home size={24} className="mr-3 text-blue-600 dark:text-blue-400" />
                  <span>Inicio</span>
                </Link>
                <Link 
                  to="/eventos" 
                  className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <Calendar size={24} className="mr-3 text-blue-600 dark:text-blue-400" />
                  <span>Calendario de Eventos</span>
                </Link>
                <Link 
                  to="/ayuda" 
                  className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <HelpCircle size={24} className="mr-3 text-blue-600 dark:text-blue-400" />
                  <span>Ayuda y Contacto</span>
                </Link>
                <Link 
                  to="/informacion" 
                  className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <Info size={24} className="mr-3 text-blue-600 dark:text-blue-400" />
                  <span>Información</span>
                </Link>
                <Link 
                  to="/admin" 
                  className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="mr-3 text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-full">Admin</span>
                  <span>Panel de Administración</span>
                </Link>
                
                {/* Dark mode toggle option */}
                <button 
                  className="flex items-center w-full p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-lg font-medium text-left"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? (
                    <Sun size={24} className="mr-3 text-yellow-500" />
                  ) : (
                    <Moon size={24} className="mr-3 text-blue-600 dark:text-blue-400" />
                  )}
                  <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  <span className="ml-2 text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-full">Demo</span>
                </button>
              </nav>
              <button 
                className="w-full mt-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg text-lg font-semibold hover:bg-blue-200 dark:hover:bg-blue-800"
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