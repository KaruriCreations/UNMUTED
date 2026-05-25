import { useEffect, useState } from 'react';

export default function SkeletonLoader({ 
  width = '100%', 
  height = '100%', 
  borderRadius = 'lg',
  animation = true,
  className = ''
}) {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const radiusMap = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'lg': 'rounded-lg',
    'full': 'rounded-full'
  };

  return (
    <div className={`animate-pulse ${animation ? '' : 'animate-none'} ${radiusMap[borderRadius] || borderRadius} w-full h-full bg-skeleton/50 ${className}`} 
         style={{ width, height, minWidth: width, minHeight: height }}>
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-skeleton/60 to-transparent animate-gradient" />
      )}
    </div>
  );
}