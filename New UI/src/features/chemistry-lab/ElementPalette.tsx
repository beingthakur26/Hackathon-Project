import React from 'react';
import { useLabStore } from './useLabStore';
import elementsData from '../../data/constants/elements.json';
import './ElementPalette.css';

export const ElementPalette: React.FC = () => {
  const { selectedElement, setSelectedElement } = useLabStore();
  
  const commonElements = ['C', 'H', 'O', 'N', 'P', 'S', 'Cl', 'F', 'Br', 'I'];

  return (
    <div className="element-palette">
      <div className="palette-section">
        <span className="section-label">Quick Access</span>
        <div className="element-grid common">
          {commonElements.map(sym => (
            <button
              key={sym}
              className={`element-btn ${selectedElement === sym ? 'is-selected' : ''}`}
              onClick={() => setSelectedElement(sym)}
              data-symbol={sym}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <span className="section-label">Periodic Table</span>
        <div className="element-grid full">
          {elementsData.map(el => (
            <button
              key={el.symbol}
              className={`element-btn mini ${selectedElement === el.symbol ? 'is-selected' : ''}`}
              title={el.name}
              onClick={() => setSelectedElement(el.symbol)}
              style={{ '--el-color': el.color } as any}
            >
              {el.symbol}
              <span className="atomic-num">{el.number}</span>
            </button>
          ))}
          <div className="more-elements">...</div>
        </div>
      </div>
    </div>
  );
};
