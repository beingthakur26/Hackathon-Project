import React, { useRef, useState } from 'react';
import { useLabStore } from './useLabStore';
import './MoleculeCanvas.css';

export const MoleculeCanvas: React.FC = () => {
  const { 
    atoms, 
    bonds, 
    mode, 
    addAtom, 
    removeAtom, 
    addBond, 
    removeBond,
    toggleBondType 
  } = useLabStore();
  
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getCoordinates = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCoordinates(e);
    
    if (mode === 'atom') {
      // Check if clicking on existing atom to start bond
      const targetAtom = (e.target as SVGElement).closest('.atom-node');
      if (targetAtom) {
        setDragStart(targetAtom.getAttribute('data-id'));
      } else {
        addAtom(coords.x, coords.y);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart) {
      setMousePos(getCoordinates(e));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStart) {
      const targetAtom = (e.target as SVGElement).closest('.atom-node');
      const endId = targetAtom?.getAttribute('data-id');
      
      if (endId && endId !== dragStart) {
        addBond(dragStart, endId);
      }
      setDragStart(null);
    }
  };

  const handleAtomClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (mode === 'erase') {
      removeAtom(id);
    }
  };

  const handleBondClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (mode === 'erase') {
      removeBond(id);
    } else {
      toggleBondType(id);
    }
  };

  return (
    <div className="canvas-wrapper">
      <svg
        ref={svgRef}
        className={`molecule-svg mode-${mode}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Temporary Bond while dragging */}
        {dragStart && (
          <line
            className="temp-bond"
            x1={atoms.find(a => a.id === dragStart)?.x}
            y1={atoms.find(a => a.id === dragStart)?.y}
            x2={mousePos.x}
            y2={mousePos.y}
          />
        )}

        {/* Render Bonds */}
        {bonds.map(bond => {
          const from = atoms.find(a => a.id === bond.from);
          const to = atoms.find(a => a.id === bond.to);
          if (!from || !to) return null;

          return (
            <g 
              key={bond.id} 
              className={`bond-group type-${bond.type}`}
              onClick={(e) => handleBondClick(e, bond.id)}
            >
              <line className="bond-hitbox" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              <line className="bond-line" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              {bond.type >= 2 && (
                <line 
                  className="bond-line double" 
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y} 
                  style={{ transform: 'translate(4px, 4px)' }}
                />
              )}
              {bond.type === 3 && (
                <line 
                  className="bond-line triple" 
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y} 
                  style={{ transform: 'translate(-4px, -4px)' }}
                />
              )}
            </g>
          );
        })}

        {/* Render Atoms */}
        {atoms.map(atom => (
          <g
            key={atom.id}
            className="atom-node"
            data-id={atom.id}
            transform={`translate(${atom.x}, ${atom.y})`}
            onClick={(e) => handleAtomClick(e, atom.id)}
          >
            <circle r="18" className="atom-bg" />
            <text dy=".35em" textAnchor="middle" className="atom-symbol">
              {atom.element}
            </text>
          </g>
        ))}
      </svg>
      
      <div className="canvas-hint">
        {mode === 'atom' ? 'Click to place atom • Drag between atoms to bond' : 
         mode === 'erase' ? 'Click on atom or bond to remove' : 
         'Click to edit structure'}
      </div>
    </div>
  );
};
