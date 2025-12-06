
import React from 'react';

interface LoaderProps {
  isLoading: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300" aria-label="Loading content">
      <div role="status" className="w-16 h-16 border-4 border-t-4 border-gray-300 border-t-blue-500 rounded-full animate-spin">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};
