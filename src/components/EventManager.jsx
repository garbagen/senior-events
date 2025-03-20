import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Image, Info, Upload, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

const EventManager = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});

  // Categories for event images
  const categories = [
    { value: 'bingo', label: 'Bingo' },
    { value: 'walk', label: 'Paseo' },
    { value: 'dance', label: 'Baile' },
    { value: 'health', label: 'Salud' },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Fetch events
        const eventsResponse = await fetch('/api/events');
        if (!eventsResponse.ok) {
          throw new Error(`Error fetching events: ${eventsResponse.status}`);
        }
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
        
        // Fetch metadata for all events
        const metadataPromises = eventsData.map(event => 
          fetch(`/api/events/${event.id}/metadata`)
            .then(res => res.json())
            .then(data => ({ [event.id]: data }))
            .catch(() => ({ [event.id]: {} }))
        );
        
        const metadataResults = await Promise.all(metadataPromises);
        const combinedMetadata = metadataResults.reduce((acc, item) => {
          return { ...acc, ...item };
        }, {});
        
        setMetadata(combinedMetadata);
      } catch (err) {
        console.error('Error loading events:', err);
        setError('No se pudieron cargar los eventos.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleEdit = (eventId) => {
    setEditingEventId(eventId);
    // Reset upload status when starting to edit
    setUploadStatus({});
  };

  const handleCancel = () => {
    setEditingEventId(null);
    setUploadStatus({});
  };

  const handleSave = async (eventId) => {
    try {
      setSaving(true);
      
      // Make a POST request to save metadata
      const response = await fetch(`/api/events/${eventId}/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata[eventId] || {})
      });
      
      if (!response.ok) {
        throw new Error('Error saving metadata');
      }
      
      // Success
      setEditingEventId(null);
    } catch (error) {
      console.error('Error saving metadata:', error);
      alert('Error al guardar los cambios: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryChange = (eventId, category) => {
    setMetadata(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        imageCategory: category
      }
    }));
  };

  const handleInfoChange = (eventId, info) => {
    setMetadata(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        additionalInfo: info
      }
    }));
  };

  const handleImageUpload = async (eventId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate that it's an image
    if (!file.type.startsWith('image/')) {
      setUploadStatus({
        status: 'error',
        message: 'Por favor, seleccione un archivo de imagen válido'
      });
      return;
    }

    try {
      setUploadingImage(true);
      setUploadStatus({
        status: 'uploading',
        message: 'Subiendo imagen...'
      });

      const formData = new FormData();
      formData.append('image', file);

      // Log what we're uploading to help debugging
      console.log('Uploading file:', file.name, file.type, file.size);
      
      const response = await fetch(`/api/events/${eventId}/upload-image`, {
        method: 'POST',
        body: formData
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Error al subir la imagen');
      }

      // Update the state with the new image path
      const imagePath = responseData.imagePath;
      
      setMetadata(prev => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          imagePath: imagePath
        }
      }));

      setUploadStatus({
        status: 'success',
        message: 'Imagen subida con éxito',
        path: imagePath
      });
      
      // Verify the image can be loaded
      setTimeout(() => {
        verifyImageExists(imagePath);
      }, 1000);

    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadStatus({
        status: 'error',
        message: `Error al subir la imagen: ${error.message}`
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const verifyImageExists = async (imagePath) => {
    try {
      // For paths that aren't full URLs (local uploads)
      const imageUrl = imagePath.startsWith('http') ? imagePath : imagePath;
      
      // Try to fetch the image to see if it exists
      const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
      
      if (!imageResponse.ok) {
        throw new Error(`Image verification failed with status: ${imageResponse.status}`);
      }
      
      setUploadStatus(prev => ({
        ...prev,
        verified: true
      }));
    } catch (error) {
      console.error('Image verification failed:', error);
      setUploadStatus(prev => ({
        ...prev,
        verified: false,
        verifyError: error.message
      }));
    }
  };

  const handleRemoveImage = async (eventId) => {
    if (!confirm('¿Está seguro de que desea eliminar la imagen?')) return;

    try {
      setSaving(true);

      // Remove the image path from metadata
      const updatedMetadata = {
        ...metadata[eventId],
        imagePath: null
      };

      // Update on the server
      const response = await fetch(`/api/events/${eventId}/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedMetadata)
      });
      
      if (!response.ok) {
        throw new Error('Error removing image metadata');
      }

      // Update the state
      setMetadata(prev => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          imagePath: null
        }
      }));

      // Reset upload status
      setUploadStatus({});

    } catch (error) {
      console.error('Error removing image:', error);
      alert('Error al eliminar la imagen: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-2xl text-gray-600">Cargando eventos...</p>
      </div>
    );
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
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Eventos</h2>
      
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <p className="text-xl text-gray-700 mb-4">
          Aquí puede gestionar información adicional para cada evento, como imágenes personalizadas
          y detalles que no están disponibles en Google Calendar.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">🛠️ Guía para subir imágenes</h3>
          <ul className="list-disc pl-6 text-blue-700 space-y-1">
            <li>Las imágenes deben ser menores a 5MB</li>
            <li>Si usa S3, verifique que las credenciales sean correctas en .env</li>
            <li>Si aparece 'Imagen subida con éxito' pero no se ve, revise los permisos de carpeta</li>
            <li>El estado 'Verificado' confirma que la imagen es accesible</li>
          </ul>
        </div>
      </div>
      
      <div className="space-y-6">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-gray-900">{event.title}</h3>
                
                {editingEventId === event.id ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSave(event.id)}
                      disabled={saving}
                      className="flex items-center p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      aria-label="Guardar"
                    >
                      <Save size={20} />
                      <span className="ml-1">Guardar</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      aria-label="Cancelar"
                    >
                      <X size={20} />
                      <span className="ml-1">Cancelar</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(event.id)}
                    className="flex items-center p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    aria-label="Editar"
                  >
                    <Edit size={20} />
                    <span className="ml-1">Editar</span>
                  </button>
                )}
              </div>
              
              <div className="text-lg text-gray-600 mb-4">
                <p>{new Date(event.date).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p>{event.location}</p>
              </div>
              
              {editingEventId === event.id ? (
                <div className="space-y-6 mt-4 bg-gray-50 p-4 rounded-lg">
                  {/* Image upload */}
                  <div>
                    <label className="flex items-center text-xl font-semibold mb-2 text-gray-700">
                      <Image size={20} className="mr-2 text-blue-600" />
                      Imagen del evento
                    </label>
                    
                    {metadata[event.id]?.imagePath ? (
                      <div className="mb-4">
                        <div className="relative w-full max-w-md mx-auto">
                          <ImageWithFallback
                            src={metadata[event.id].imagePath}
                            alt={event.title}
                            className="w-full h-48 object-cover rounded-lg"
                            retryCount={3}
                            retryDelay={2000}
                          />
                          <button
                            onClick={() => handleRemoveImage(event.id)}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        {/* Image status indicator */}
                        <div className="mt-2 text-center">
                          {uploadStatus.status === 'success' && (
                            <div className="flex items-center justify-center text-green-600">
                              <CheckCircle size={16} className="mr-1" />
                              <span>{uploadStatus.message}</span>
                              {uploadStatus.hasOwnProperty('verified') && (
                                <span className="ml-2">
                                  {uploadStatus.verified 
                                    ? '(Verificado)' 
                                    : '(No verificado - puede que no sea accesible)'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Upload size={48} className="text-gray-400 mb-4" />
                        <p className="text-lg text-gray-500 mb-4">
                          Subir una imagen para este evento
                        </p>
                        <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700">
                          <span>Seleccionar archivo</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(event.id, e)}
                            disabled={uploadingImage}
                          />
                        </label>
                        
                        {/* Upload status message */}
                        {uploadStatus.status && (
                          <div className={`mt-4 p-2 rounded-lg ${
                            uploadStatus.status === 'error' ? 'bg-red-50 text-red-600' :
                            uploadStatus.status === 'success' ? 'bg-green-50 text-green-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            <div className="flex items-center">
                              {uploadStatus.status === 'error' ? (
                                <AlertTriangle size={16} className="mr-1" />
                              ) : uploadStatus.status === 'success' ? (
                                <CheckCircle size={16} className="mr-1" />
                              ) : (
                                <span className="mr-1 inline-block h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                              )}
                              <span>{uploadStatus.message}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Image category */}
                  <div>
                    <label className="flex items-center text-xl font-semibold mb-2 text-gray-700">
                      <Image size={20} className="mr-2 text-blue-600" />
                      Categoría de imagen predefinida
                    </label>
                    <p className="text-gray-500 mb-4">
                      Si no sube una imagen personalizada, se utilizará la imagen de la categoría seleccionada.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map(category => (
                        <div 
                          key={category.value}
                          className={`
                            p-3 border-2 rounded-lg cursor-pointer text-center
                            ${metadata[event.id]?.imageCategory === category.value 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'}
                          `}
                          onClick={() => handleCategoryChange(event.id, category.value)}
                        >
                          {category.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Additional information */}
                  <div>
                    <label className="flex items-center text-xl font-semibold mb-2 text-gray-700">
                      <Info size={20} className="mr-2 text-blue-600" />
                      Información adicional
                    </label>
                    <textarea
                      value={metadata[event.id]?.additionalInfo || ''}
                      onChange={(e) => handleInfoChange(event.id, e.target.value)}
                      className="w-full h-32 p-3 border-2 border-gray-200 rounded-lg"
                      placeholder="Añada información adicional sobre este evento..."
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  {/* Image preview */}
                  {metadata[event.id]?.imagePath && (
                    <div className="mb-4">
                      <ImageWithFallback
                        src={metadata[event.id].imagePath}
                        alt={event.title}
                        className="w-full max-w-md h-48 object-cover rounded-lg mx-auto"
                        retryCount={3}
                        retryDelay={2000}
                      />
                    </div>
                  )}
                
                  <div className="flex items-center mb-2">
                    <Image size={20} className="mr-2 text-blue-600" />
                    <span className="text-lg font-semibold">Categoría:</span>
                    <span className="ml-2 text-lg">
                      {metadata[event.id]?.imageCategory 
                        ? categories.find(c => c.value === metadata[event.id]?.imageCategory)?.label || metadata[event.id]?.imageCategory
                        : 'No especificada'}
                    </span>
                  </div>
                  
                  {metadata[event.id]?.additionalInfo && (
                    <div className="mt-2">
                      <div className="flex items-start">
                        <Info size={20} className="mr-2 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <span className="text-lg font-semibold">Información adicional:</span>
                          <p className="text-lg text-gray-700 mt-1">{metadata[event.id]?.additionalInfo}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventManager;