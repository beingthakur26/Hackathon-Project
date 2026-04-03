import React, { useEffect, useRef, useState } from 'react';
import * as $3Dmol from '3dmol';
import './Molecule3D.css';

interface Molecule3DProps {
  smiles?: string;
  sdf?: string;
  style?: 'stick' | 'sphere' | 'line' | 'cartoon';
  autoRotate?: boolean;
}

export const Molecule3D: React.FC<Molecule3DProps> = ({ 
  smiles, 
  sdf: initialSdf, 
  style = 'stick',
  autoRotate = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize viewer
    if (!viewerRef.current) {
      viewerRef.current = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: 'transparent'
      });
    }

    const loadMolecule = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let sdfData = initialSdf;
        
        if (!sdfData && smiles) {
          const res = await fetch(`http://localhost:8000/molecule/sdf/${encodeURIComponent(smiles)}`);
          if (!res.ok) throw new Error('Failed to fetch 3D data');
          const data = await res.json();
          sdfData = data.sdf;
        }

        if (sdfData && viewerRef.current) {
          viewerRef.current.clear();
          viewerRef.current.addModel(sdfData, 'sdf');
          
          const styleConfig: any = {};
          if (style === 'stick') styleConfig.stick = { radius: 0.2 };
          else if (style === 'sphere') styleConfig.sphere = { scale: 0.3 };
          else if (style === 'line') styleConfig.line = {};
          else if (style === 'cartoon') styleConfig.cartoon = { color: 'spectrum' };
          
          viewerRef.current.setStyle({}, styleConfig);
          viewerRef.current.zoomTo();
          viewerRef.current.render();
          
          if (autoRotate) {
            viewerRef.current.spin(true);
          } else {
            viewerRef.current.spin(false);
          }
        }
      } catch (err) {
        setError('Could not load 3D model.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMolecule();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.spin(false);
      }
    };
  }, [smiles, initialSdf, style, autoRotate]);

  return (
    <div className="molecule-3d-wrapper">
      <div ref={containerRef} className="molecule-3d-container" />
      {loading && <div className="molecule-3d-overlay">Generating 3D coordinates...</div>}
      {error && <div className="molecule-3d-overlay is-error">{error}</div>}
      <div className="molecule-3d-controls">
        <span className="control-hint">Drag to rotate • Scroll to zoom</span>
      </div>
    </div>
  );
};
