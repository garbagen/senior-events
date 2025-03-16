import React from 'react';
import { X } from 'lucide-react';

export const AlertDialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="relative bg-white rounded-2xl max-w-lg w-full mx-4 p-6" role="dialog">
        {children}
      </div>
    </div>
  );
};

export const AlertDialogContent = ({ children, className = '' }) => (
  <div className={`relative ${className}`}>{children}</div>
);

export const AlertDialogHeader = ({ children }) => (
  <div className="space-y-4">{children}</div>
);

export const AlertDialogTitle = ({ children }) => (
  <h2 className="text-3xl font-bold text-gray-900">{children}</h2>
);

export const AlertDialogDescription = ({ children }) => (
  <div className="text-2xl text-gray-700">{children}</div>
);

export const AlertDialogAction = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="mt-6 w-full bg-blue-600 text-white text-2xl font-semibold py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors"
  >
    {children}
  </button>
);