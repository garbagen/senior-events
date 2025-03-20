// src/components/ImageWithFallback.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = '', 
  fallbackClassName = '',
  retryCount = 2,
  retryDelay = 1500,
  onError = () => {},
  onLoad = () => {} 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retries, setRetries] = useState(0);
  const [imgSrc, setImgSrc] = useState(src);
  
  // Reset state when src changes
  useEffect(() => {
    setImgSrc(src);
    setLoading(true);
    setError(false);
    setRetries(0);
  }, [src]);
  
  // Handle automatic retry
  useEffect(() => {
    if (error && retries < retryCount) {
      const timer = setTimeout(() => {
        console.log(`Retrying image load (${retries + 1}/${retryCount}): ${src}`);
        setImgSrc(`${src}?retry=${Date.now()}`); // Add cache-busting parameter
        setLoading(true);
        setError(false);
        setRetries(retries + 1);
      }, retryDelay);
      
      return () => clearTimeout(timer);
    }
  }, [error, retries, retryCount, retryDelay, src]);
  
  const handleError = () => {
    console.error(`Failed to load image: ${imgSrc}`);
    setLoading(false);
    setError(true);
    onError();
  };
  
  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad();
  };
  
  const handleRetry = () => {
    setImgSrc(`${src}?retry=${Date.now()}`);
    setLoading(true);
    setError(false);
  };
  
  return (
    <div className="relative">
      {/* Actual image */}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ display: error ? 'none' : 'block' }}
        onError={handleError}
        onLoad={handleLoad}
      />
      
      {/* Loading indicator */}
      {loading && !error && (
        <div className={`flex items-center justify-center bg-gray-100 ${fallbackClassName || className}`}>
          <div className="text-center p-4">
            <RefreshCw className="mx-auto h-10 w-10 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Cargando imagen...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className={`flex items-center justify-center bg-red-50 ${fallbackClassName || className}`}>
          <div className="text-center p-4">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-500 mb-2" />
            <p className="text-sm text-red-600 mb-2">Error al cargar la imagen</p>
            <button 
              onClick={handleRetry}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageWithFallback;