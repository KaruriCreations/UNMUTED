import { useState, useEffect } from 'react';

export default function LoadingScreen({ show, message = 'Loading...' }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background-dark/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted">{message}</p>
      </div>
    </div>
  );
}