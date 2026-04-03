import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { DateTime } from 'luxon';
import { Button } from '../ui/components/Button';
import './BatchPage.css';

interface BatchResult {
  smiles: string;
  prediction: string;
  toxicity_probability?: number;
}

export const BatchPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processBatch = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/predict-batch/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // The backend returns {"predictions": [0, 1, ...]}
      // We need to map this back to the original SMILES if possible, 
      // but the current backend prediction-batch doesn't return the SMILES.
      // I'll need to read the file locally to match them.
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',');
        const smilesIndex = headers.indexOf('smiles');

        if (smilesIndex === -1) {
          setError('CSV must contain a "smiles" column.');
          setIsUploading(false);
          return;
        }

        const smilesList = lines.slice(1).map(line => line.split(',')[smilesIndex]);
        const mappedResults = smilesList.map((smiles, index) => ({
          smiles,
          prediction: response.data.predictions[index] === 1 ? 'Toxic' : 'Non-Toxic'
        }));

        setResults(mappedResults);
        setIsUploading(false);
      };
      reader.readAsText(file);

    } catch (err) {
      console.error(err);
      setError('Failed to process batch file. Please ensure it is a valid CSV.');
      setIsUploading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    const date = DateTime.now().toLocaleString(DateTime.DATETIME_MED);

    doc.setFontSize(22);
    doc.text('ToxinAI Batch Analysis Report', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 14, 28);
    doc.text(`File: ${file?.name}`, 14, 33);

    const tableData = results.map((res, i) => [
      i + 1,
      res.smiles,
      res.prediction
    ]);

    doc.autoTable({
      startY: 45,
      head: [['#', 'SMILES String', 'Toxicity Result']],
      body: tableData,
      headStyles: { fillStyle: [0, 0, 0], textColor: [255, 255, 255] },
      alternateRowStyles: { fillStyle: [245, 245, 245] },
    });

    doc.save(`ToxinAI_Report_${file?.name.replace('.csv', '')}.pdf`);
  };

  return (
    <div className="batch-page">
      <header className="batch-header">
        <div className="container">
          <h1 className="batch-title">Batch Analysis</h1>
          <p className="batch-subtitle">Upload CSV files for high-throughput toxicity screening.</p>
        </div>
      </header>

      <main className="batch-main container">
        <section className="upload-zone">
          <div className={`drop-card ${file ? 'has-file' : ''}`}>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              id="file-input"
              className="hidden-input"
            />
            <label htmlFor="file-input" className="drop-label">
              <div className="drop-icon">
                {isUploading ? <Loader2 className="spin" /> : file ? <FileText /> : <Upload />}
              </div>
              <div className="drop-text">
                {file ? file.name : 'Drag & drop CSV or click to browse'}
                <span className="drop-subtext">Must contain a "smiles" column</span>
              </div>
            </label>
            
            {file && !isUploading && (
              <div className="drop-actions">
                <Button variant="ghost" onClick={() => setFile(null)}>
                  <Trash2 size={16} />
                </Button>
                <Button variant="primary" onClick={processBatch}>
                  Run Analysis
                </Button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="error-banner"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {results.length > 0 && (
          <motion.section 
            className="results-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="results-header">
              <div className="results-summary">
                <span className="stat">Analyzed <strong>{results.length}</strong> compounds</span>
                <span className="stat toxic"><strong>{results.filter(r => r.prediction === 'Toxic').length}</strong> Toxic</span>
              </div>
              <div className="results-actions">
                <Button variant="secondary" size="sm" onClick={exportPDF}>
                  <Download size={16} />
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="results-table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>SMILES String</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 10).map((res, i) => (
                    <tr key={i}>
                      <td className="smiles-cell">{res.smiles}</td>
                      <td>
                        <span className={`pill ${res.prediction === 'Toxic' ? 'toxic' : 'safe'}`}>
                          {res.prediction === 'Toxic' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                          {res.prediction}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {results.length > 10 && (
                    <tr>
                      <td colSpan={2} className="more-hint">
                        And {results.length - 10} more... (Download PDF for full report)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
};

export default BatchPage;
