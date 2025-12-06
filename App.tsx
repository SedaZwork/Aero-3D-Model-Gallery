import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ThreeScene } from './components/ThreeScene';
import { ControlPanel } from './components/ControlPanel';
import { Loader } from './components/Loader';
import { Header } from './components/Header';
import { ModelDescription } from './components/ModelDescription';
import { MODELS } from './constants';
import type { Model, Rotation } from './types';

interface ThumbnailCarouselProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (url: string) => void;
  isArMode: boolean;
}

const ThumbnailCarousel: React.FC<ThumbnailCarouselProps> = ({ models, selectedModel, onModelChange, isArMode }) => (
  <div className={`absolute bottom-0 left-0 right-0 p-4 z-10 transition-opacity duration-500 ${isArMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
    <div className="mx-auto max-w-screen-lg bg-white/50 backdrop-blur-md rounded-xl shadow-lg p-2">
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {models.map((model) => (
          <button
            key={model.url}
            onClick={() => onModelChange(model.url)}
            className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${selectedModel === model.url ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white/50' : 'ring-1 ring-gray-300'}`}
            aria-label={`Select ${model.name} model`}
            aria-pressed={selectedModel === model.url}
          >
            <img 
              src={model.thumbnail} 
              alt={model.name} 
              className="w-full h-full object-cover" 
            />
          </button>
        ))}
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].url);
  const [rotation, setRotation] = useState<Rotation>({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState<number>(1);
  const [backgroundColor, setBackgroundColor] = useState<string>('#f0f2f5');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [isArMode, setIsArMode] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentModel = useMemo(() => {
    return MODELS.find(m => m.url === selectedModel);
  }, [selectedModel]);

  const handleModelChange = useCallback((url: string) => {
    setIsLoading(true);
    setRotation({ x: 0, y: 0, z: 0 });
    setScale(1);
    setSelectedModel(url);
  }, []);

  const handleToggleArMode = useCallback(async () => {
    if (isArMode) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsArMode(false);
    } else {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          setIsArMode(true);
        } catch (error) {
          console.error("Error accessing camera for AR mode:", error);
          alert("Could not access camera. Please ensure you have a camera and have granted permission.");
        }
      } else {
        alert("Your browser does not support the required camera features for AR mode.");
      }
    }
  }, [isArMode]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  return (
    <main className="relative w-full h-full overflow-hidden bg-gray-100">
      <video ref={videoRef} className={`absolute top-0 left-0 w-full h-full object-cover -z-10 ${isArMode ? 'block' : 'hidden'}`} playsInline muted />
      
      <Header isHidden={isArMode} />

      <ThreeScene
        modelUrl={selectedModel}
        scale={scale}
        rotation={rotation}
        backgroundColor={backgroundColor}
        setIsLoading={setIsLoading}
        isArMode={isArMode}
      />

      <ModelDescription
        name={currentModel?.name || ''}
        description={currentModel?.description || ''}
        isVisible={!isArMode && !showControls && !isLoading}
      />

      <div className={`absolute top-20 right-4 z-20 flex flex-col items-center space-y-2 transition-opacity duration-300 ${showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button
          onClick={() => setShowControls(true)}
          className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-md hover:bg-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open controls"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button
          onClick={handleToggleArMode}
          className={`p-2 backdrop-blur-md rounded-full shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isArMode ? 'bg-blue-500 text-white ring-blue-300' : 'bg-white/80 text-gray-700 ring-transparent'}`}
          aria-label="Toggle AR Mode"
          aria-pressed={isArMode}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7v10l8 4m0-14L4 7m8 4v10" />
          </svg>
        </button>
      </div>


      <ControlPanel
        show={showControls}
        rotation={rotation}
        onRotationChange={setRotation}
        scale={scale}
        onScaleChange={setScale}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
        onClose={() => setShowControls(false)}
        isArMode={isArMode}
      />
      
      <ThumbnailCarousel 
        models={MODELS}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        isArMode={isArMode}
      />

      <Loader isLoading={isLoading} />
    </main>
  );
};

export default App;