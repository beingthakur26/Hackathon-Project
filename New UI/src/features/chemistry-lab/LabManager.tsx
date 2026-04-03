import React, { useState, useEffect } from 'react';
import { ElementPalette } from './ElementPalette';
import { MoleculeCanvas } from './MoleculeCanvas';
import { Molecule3DCanvas } from './Molecule3DCanvas';
import { useLabStore } from './useLabStore';
import { Trash2, Eraser, Plus, Zap, Send, Box, Square } from 'lucide-react';
import './LabManager.css';

export const LabManager: React.FC = () => {
  const { mode, setMode, viewMode, setViewMode, clear, atoms, bonds } = useLabStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleExport = () => {
    console.log('Exporting structure:', { atoms, bonds });
    alert('Structure exported to toxicity engine.');
  };

  return (
    <div className="lab-manager">
      <ElementPalette />
      
      <div className="lab-workspace">
        <div className="lab-toolbar">
          <div className="tool-group">
            <button 
              className={`tool-btn ${mode === 'atom' ? 'is-active' : ''}`}
              onClick={() => setMode('atom')}
              title="Add Atoms & Bonds"
            >
              <Plus size={18} />
              <span>Draw</span>
            </button>
            <button 
              className={`tool-btn ${mode === 'erase' ? 'is-active' : ''}`}
              onClick={() => setMode('erase')}
              title="Erase"
            >
              <Eraser size={18} />
              <span>Erase</span>
            </button>
          </div>

          <div className="tool-divider" />

          <div className="tool-group">
            <button 
              className={`tool-btn ${viewMode === '2d' ? 'is-active' : ''}`}
              onClick={() => setViewMode('2d')}
              title="2D View"
            >
              <Square size={18} />
              <span>2D</span>
            </button>
            <button 
              className={`tool-btn ${viewMode === '3d' ? 'is-active' : ''}`}
              onClick={() => !isMobile && setViewMode('3d')}
              disabled={isMobile}
              title={isMobile ? "3D Mode available on Desktop only" : "3D Mode"}
            >
              <Box size={18} />
              <span>3D</span>
            </button>
          </div>

          <div className="tool-divider" />

          <div className="tool-group">
            <button className="tool-btn danger" onClick={clear} title="Clear Canvas">
              <Trash2 size={18} />
              <span>Clear</span>
            </button>
          </div>

          <div className="tool-spacer" />

          <button className="tool-btn primary" onClick={handleExport} disabled={atoms.length === 0}>
            <Send size={18} />
            <span>Analyze in Lab</span>
          </button>
        </div>

        {viewMode === '2d' ? <MoleculeCanvas /> : <Molecule3DCanvas />}

        {isMobile && viewMode === '3d' && (
          <div className="mobile-only-overlay">
            <div className="overlay-content">
              <h3>3D Mode Restricted</h3>
              <p>Please switch to Desktop to use the 3D molecular workspace.</p>
              <button 
                className="tool-btn primary" 
                onClick={() => setViewMode('2d')}
              >
                Return to 2D
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="lab-stats">
        <div className="stat-item">
          <Zap size={14} />
          <span>{atoms.length} Atoms</span>
        </div>
        <div className="stat-item">
          <span>{bonds.length} Bonds</span>
        </div>
      </div>
    </div>
  );
};
