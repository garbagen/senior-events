// src/components/ImageWithFallback.jsx
import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, RefreshCw, Image as ImageIcon } from 'lucide-react';

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = '', 
  fallbackClassName = '',
  retryCount = 3,
  retryDelay = 1500,
  onError = () => {},
  onLoad = () => {},
  placeholder = null
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retries, setRetries] = useState(0);
  const [imgSrc, setImgSrc] = useState('');
  const imageRef = useRef(null);
  
  // For debugging - track image loading attempts
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Reset state when src changes
  useEffect(() => {
    console.log(`ImageWithFallback: Source changed to ${src}`);
    
    if (!src) {
      console.warn('ImageWithFallback: No source provided');
      setError(true);
      setLoading(false);
      return;
    }
    
    setImgSrc(src);
    setLoading(true);
    setError(false);
    setRetries(0);
    setLoadAttempts(0);
  }, [src]);
  
  // Handle automatic retry
  useEffect(() => {
    let timer;
    if (error && retries < retryCount) {
      console.log(`ImageWithFallback: Retry ${retries + 1}/${retryCount} for ${src}`);
      timer = setTimeout(() => {
        // Add cache-busting parameter and append current time to force a fresh attempt
        const newSrc = `${src}${src.includes('?') ? '&' : '?'}retry=${Date.now()}`;
        console.log(`ImageWithFallback: Retrying with ${newSrc}`);
        setImgSrc(newSrc);
        setLoading(true);
        setError(false);
        setRetries(prev => prev + 1);
        setLoadAttempts(prev => prev + 1);
      }, retryDelay);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [error, retries, retryCount, retryDelay, src]);
  
  // Preload image to check if it exists
  useEffect(() => {
    if (!imgSrc) return;
    
    console.log(`ImageWithFallback: Preloading image ${imgSrc}`);
    setLoadAttempts(prev => prev + 1);
    
    const img = new Image();
    img.onload = () => {
      console.log(`ImageWithFallback: Successfully preloaded ${imgSrc}`);
      setLoading(false);
      setError(false);
    };
    img.onerror = (e) => {
      console.error(`ImageWithFallback: Failed to preload ${imgSrc}`, e);
      setLoading(false);
      setError(true);
    };
    img.src = imgSrc;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imgSrc]);
  
  const handleError = () => {
    console.error(`ImageWithFallback: Error loading image: ${imgSrc}`);
    console.error(`Image element details:`, {
      naturalWidth: imageRef.current?.naturalWidth || 'unknown',
      naturalHeight: imageRef.current?.naturalHeight || 'unknown',
      complete: imageRef.current?.complete || 'unknown'
    });
    setLoading(false);
    setError(true);
    onError();
  };
  
  const handleLoad = () => {
    console.log(`ImageWithFallback: Successfully loaded ${imgSrc}`);
    console.log(`Image dimensions: ${imageRef.current?.naturalWidth || 'unknown'}x${imageRef.current?.naturalHeight || 'unknown'}`);
    setLoading(false);
    setError(false);
    onLoad();
  };
  
  const handleRetry = () => {
    console.log(`ImageWithFallback: Manual retry for ${src}`);
    if (retries >= retryCount) {
      // Reset retry count when manually retrying after max auto-retries
      setRetries(0);
    }
    setImgSrc(`${src}?retry=${Date.now()}`);
    setLoading(true);
    setError(false);
    setLoadAttempts(prev => prev + 1);
  };
  
  // If we have a placeholder and the image is errored, show placeholder
  if (error && placeholder) {
    return placeholder;
  }
  
  // Default placeholder if none provided
  const defaultPlaceholder = (
    <div className={`flex items-center justify-center bg-blue-50 ${fallbackClassName || className}`}>
      <div className="text-center">
        <ImageIcon size={48} className="mx-auto mb-2 text-blue-300" />
        <p className="text-lg text-blue-500">{alt}</p>
      </div>
    </div>
  );
  
  return (
    <div className="relative">
      {/* Debug overlay */}
      <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white text-xs p-1 z-10">
        Attempts: {loadAttempts}, Retries: {retries}
      </div>
      
      {/* Actual image */}
      {imgSrc && (
        <img
          ref={imageRef}
          src={imgSrc}
          alt={alt}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={{ display: error ? 'none' : 'block' }}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
        />
      )}
      
      {/* Loading indicator */}
      {loading && !error && (
        <div className={`flex items-center justify-center bg-gray-100 ${fallbackClassName || className}`}>
          <div className="text-center p-4">
            <RefreshCw className="mx-auto h-10 w-10 text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Cargando imagen...</p>
            <p className="text-xs text-gray-500">URL: {imgSrc?.substring(0, 30)}...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className={`flex items-center justify-center bg-red-50 ${fallbackClassName || className}`}>
          <div className="text-center p-4">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-500 mb-2" />
            <p className="text-sm text-red-600 mb-2">Error al cargar la imagen</p>
            <p className="text-xs text-red-500 mb-2">URL: {imgSrc?.substring(0, 30)}...</p>
            <button 
              onClick={handleRetry}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
      
      {/* Show placeholder/fallback when no image is provided */}
      {!imgSrc && defaultPlaceholder}
    </div>
  );
};

export default ImageWithFallback;