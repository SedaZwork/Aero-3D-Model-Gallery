import React from 'react';
import { SDFLiquidEditor } from './components/SDFLiquidEditor';

const App: React.FC = () => {
  return (
    <main className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <SDFLiquidEditor />
    </main>
  );
};

export default App;
