import React from 'react';

interface ModelDescriptionProps {
  name: string;
  description: string;
  isVisible: boolean;
}

export const ModelDescription: React.FC<ModelDescriptionProps> = ({ name, description, isVisible }) => {
  return (
    <div
      className={`absolute top-20 left-4 z-20 w-64 md:w-72 p-4 bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-xl transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}
      aria-hidden={!isVisible}
    >
      <h3 className="text-lg font-bold text-gray-800 mb-2">{name}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};
