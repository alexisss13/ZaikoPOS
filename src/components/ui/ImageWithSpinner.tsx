'use client';

import { useState } from 'react';
import { Loading02Icon } from 'hugeicons-react';

interface ImageWithSpinnerProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  containerClassName?: string;
  spinnerSize?: number;
  priority?: boolean;
}

export function ImageWithSpinner({
  src,
  alt,
  className = '',
  fallback,
  containerClassName = '',
  spinnerSize = 20,
  priority = false,
}: ImageWithSpinnerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError && fallback) {
    return <div className={containerClassName}>{fallback}</div>;
  }

  return (
    <div className={`relative ${containerClassName}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <Loading02Icon 
            size={spinnerSize} 
            className="animate-spin text-slate-300" 
            strokeWidth={2}
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
