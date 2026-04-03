import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Activity, Cuboid, Download } from 'lucide-react';
import { useToxicityStore } from './useToxicityStore';
import { Molecule3D } from '../../ui/components/Molecule3D';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { DateTime } from 'luxon';
import './ToxicityResult.css';

const DESCRIPTOR_LABELS: Record<string, string> = {
  mol_weight: 'Mol. Weight',
  logP: 'LogP',
  hbd: 'H-Bond Donors',
  hba: 'H-Bond Acceptors',
  tpsa: 'TPSA',
  qed: 'QED Score',
  aromatic_rings: 'Aromatic Rings',
};

export const ToxicityResult: React.FC = () => {
  const { result, loading } = useToxicityStore();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF() as any;
    const date = DateTime.now().toLocaleString(DateTime.DATETIME_MED);

    doc.setFontSize(22);
    doc.text('ToxinAI Analysis Report', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 14, 28);
    doc.text(`Chemical: ${result.iupac_name || 'Unknown Compound'}`, 14, 33);

    const tableData = Object.entries(DESCRIPTOR_LABELS).map(([key, label]) => {
      const val = result.features[key as keyof typeof result.features];
      return [label, typeof val === 'number' ? val.toFixed(3) : val];
    });

    doc.autoTable({
      startY: 45,
      head: [['Descriptor', 'Value']],
      body: [
        ['Overall Prediction', result.prediction_label],
        ['Toxicity Probability', `${((result.toxicity_probability ?? 0) * 100).toFixed(1)}%`],
        ['Formula', result.molecular_formula],
        ['SMILES', result.smiles],
        ...tableData
      ],
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      alternateRowStyles: { fillLine: [245, 245, 245] },
    });

    doc.save(`ToxinAI_Report_${result.iupac_name?.replace(/\s+/g, '_') || 'Result'}.pdf`);
  };

  if (loading) {
    return (
      <div className="result-loading">
        <div className="loading-spinner" />
        <p>Analyzing molecular structure...</p>
      </div>
    );
  }

  if (!result) return null;

  const isToxic = result.prediction === 1;
  const prob = result.toxicity_probability ?? 0;

  return (
    <motion.div
      className="toxicity-result"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className={`verdict-banner ${isToxic ? 'is-toxic' : 'is-safe'}`}>
        <div className="verdict-banner__main">
          <div className="verdict-banner__left">
            <div className="verdict-status">
              {isToxic ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
              <span>{isToxic ? 'Potential Hazard Detected' : 'No Acute Toxicity Found'}</span>
            </div>
            <div className="verdict-value">
              {result.prediction_label}
            </div>
          </div>
          <button className="download-report-btn" onClick={downloadPDF} title="Download Report">
            <Download size={20} />
            <span>Report PDF</span>
          </button>
        </div>
        <div className="verdict-probability">
          <div className="prob-label">Confidence Score</div>
          <div className="prob-value">{(prob * 100).toFixed(1)}%</div>
          <div className="prob-bar">
            <motion.div 
              className="prob-bar__fill" 
              initial={{ width: 0 }}
              animate={{ width: `${prob * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Structure & Info */}
      <div className="structure-section">
        <div className="structure-header">
          <div className="structure-tabs">
            <button 
              className={`structure-tab ${viewMode === '2d' ? 'is-active' : ''}`}
              onClick={() => setViewMode('2d')}
            >
              2D Structure
            </button>
            <button 
              className={`structure-tab ${viewMode === '3d' ? 'is-active' : ''}`}
              onClick={() => setViewMode('3d')}
            >
              <Cuboid size={14} /> 3D Model
            </button>
          </div>
        </div>

        <div className="molecule-preview-wrap">
          {viewMode === '2d' ? (
            <div className="molecule-preview">
              <div className="preview-container">
                {result.molecule_image ? (
                  <img
                    src={`data:image/png;base64,${result.molecule_image}`}
                    alt="Molecular structure"
                  />
                ) : (
                  <div className="no-preview">No structure available</div>
                )}
              </div>
            </div>
          ) : (
            <Molecule3D smiles={result.smiles} />
          )}
        </div>

        <div className="compound-details">
          <div className="detail-item">
            <span className="detail-label">IUPAC Name</span>
            <span className="detail-value">{result.iupac_name || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Formula</span>
            <span className="detail-value formula">{result.molecular_formula}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">SMILES</span>
            <span className="detail-value mono">{result.canonical_smiles}</span>
          </div>
        </div>
      </div>

      {/* Numerical Data */}
      <div className="descriptors-section">
        <div className="section-header">
          <Activity size={16} />
          <span>Molecular Descriptors</span>
        </div>
        <div className="descriptors-table">
          {Object.entries(DESCRIPTOR_LABELS).map(([key, label]) => {
            const val = result.features[key as keyof typeof result.features];
            return (
              <div key={key} className="descriptor-cell">
                <span className="lbl">{label}</span>
                <span className="val">{typeof val === 'number' ? val.toFixed(3) : val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
