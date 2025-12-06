import React from 'react';
import type { Rotation } from '../types';

interface ControlPanelProps {
  show: boolean;
  rotation: Rotation;
  onRotationChange: (rotation: Rotation) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onClose: () => void;
  isArMode: boolean;
}

const ControlInput: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col space-y-2">
    <label className="text-sm font-medium text-gray-600">{label}</label>
    {children}
  </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  show,
  rotation,
  onRotationChange,
  scale,
  onScaleChange,
  backgroundColor,
  onBackgroundColorChange,
  onClose,
  isArMode,
}) => {
  return (
    <aside 
      className={`absolute top-4 right-4 z-30 w-64 md:w-72 transform transition-all duration-300 ease-in-out ${show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}
      aria-hidden={!show}
    >
      <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl p-4 shadow-xl text-gray-800 space-y-6">
        
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">Controls</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800" aria-label="Close controls">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ControlInput label={`Scale: ${scale.toFixed(2)}`}>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </ControlInput>
        
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-600">Rotation</h3>
          <ControlInput label={`X: ${Math.round(rotation.x * 180 / Math.PI)}°`}>
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.01"
              value={rotation.x}
              onChange={(e) => onRotationChange({ ...rotation, x: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </ControlInput>
          <ControlInput label={`Y: ${Math.round(rotation.y * 180 / Math.PI)}°`}>
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.01"
              value={rotation.y}
              onChange={(e) => onRotationChange({ ...rotation, y: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </ControlInput>
          <ControlInput label={`Z: ${Math.round(rotation.z * 180 / Math.PI)}°`}>
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.01"
              value={rotation.z}
              onChange={(e) => onRotationChange({ ...rotation, z: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </ControlInput>
        </div>

        {!isArMode && (
          <ControlInput label="Background Color">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="w-full h-10 p-1 bg-white border border-gray-300 rounded-md cursor-pointer"
            />
          </ControlInput>
        )}

      </div>
    </aside>
  );
};