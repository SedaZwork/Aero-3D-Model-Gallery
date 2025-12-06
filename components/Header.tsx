import React from 'react';

export const Header: React.FC<{ isHidden?: boolean }> = ({ isHidden }) => {
  return (
    <header className={`absolute top-0 left-0 right-0 p-4 flex justify-center z-10 transition-opacity duration-500 ${isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="bg-white/70 backdrop-blur-md border border-gray-200/80 rounded-xl px-6 py-2 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wider">
          3D Model Gallery
        </h1>
      </div>
    </header>
  );
};
