import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, X } from 'lucide-react';
import { FadeIn } from '../ui/animations/FadeIn';
import { Input } from '../ui/components/Input';
import { Spinner } from '../ui/components/Spinner';
import { exploreService } from '../data/services/explore.service';
import { Molecule3D } from '../ui/components/Molecule3D';
import type { DrugEntry, DrugDetail } from '../data/models/molecule.model';
import './ExplorePage.css';

const POPULAR = [
  'Aspirin', 'Caffeine', 'Ibuprofen', 'Paracetamol',
  'Morphine', 'Metformin', 'Benzene', 'Ethanol',
];

const ExplorePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DrugEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<DrugDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await exploreService.search(q);
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { if (query) handleSearch(query); }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const openDetail = async (name: string) => {
    setDetailLoading(true);
    setViewMode('2d');
    try {
      const detail = await exploreService.getDrug(name.toLowerCase());
      setSelected(detail);
    } catch {
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="explore-page">
      <div className="container">
        <FadeIn>
          <div className="page-header">
            <h1 className="page-title">Drug <em>Explorer</em>.</h1>
          </div>
        </FadeIn>

        <div className="explore-controls">
          <div className="search-wrap">
            <Input
              id="explore-search"
              value={query}
              onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
              placeholder="Search by name, category, or formula…"
              icon={<Search size={18} />}
              fullWidth
            />
          </div>
          {!query && (
            <div className="popular-tags">
              <span className="tags-label">Popular:</span>
              <div className="tags-list">
                {POPULAR.map((name) => (
                  <button key={name} className="tag-item" onClick={() => openDetail(name)}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading && <div className="explore-state-msg"><Spinner /> Searching laboratory records...</div>}

        {results.length > 0 && !loading && (
          <div className="explore-grid">
            {results.map((drug, i) => (
              <motion.div 
                key={i} 
                className="drug-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openDetail(drug.name)}
              >
                <div className="drug-card__meta">
                  <span className="drug-category">{drug.category}</span>
                </div>
                <h3 className="drug-name">{drug.name}</h3>
                <div className="drug-footer">
                  <span className="view-link">View Details <ArrowRight size={14} /></span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {(selected || detailLoading) && (
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            >
              <motion.div
                className="detail-modal"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button className="modal-close" onClick={() => setSelected(null)}>
                  <X size={20} />
                </button>
                {detailLoading ? (
                  <div className="modal-spinner">
                    <Spinner size="md" />
                  </div>
                ) : selected && (
                  <div className="modal-inner">
                    <div className="modal-header">
                      <div className="modal-header__main">
                        <span className="modal-category">{selected.category}</span>
                        <h2 className="modal-title">{selected.name}</h2>
                        <p className="modal-subtitle">{selected.iupac_name}</p>
                      </div>
                      <div className="modal-view-tabs">
                        <button 
                          className={`view-tab ${viewMode === '2d' ? 'is-active' : ''}`}
                          onClick={() => setViewMode('2d')}
                        >
                          2D
                        </button>
                        <button 
                          className={`view-tab ${viewMode === '3d' ? 'is-active' : ''}`}
                          onClick={() => setViewMode('3d')}
                        >
                          3D
                        </button>
                      </div>
                    </div>

                    <div className="modal-body">
                      <div className="modal-visual-section">
                        {viewMode === '2d' ? (
                          <div className="modal-image-wrap">
                            {selected.molecule_image ? (
                              <img src={`data:image/png;base64,${selected.molecule_image}`} alt={selected.name} />
                            ) : (
                              <div className="no-visual">No structure available</div>
                            )}
                          </div>
                        ) : (
                          <Molecule3D smiles={selected.smiles} />
                        )}
                      </div>
                      
                      <div className="modal-info-grid">
                        <div className="info-box">
                          <span className="info-lbl">Formula</span>
                          <span className="info-val">{selected.molecular_formula}</span>
                        </div>
                        <div className="info-box">
                          <span className="info-lbl">SMILES</span>
                          <span className="info-val mono">{selected.smiles}</span>
                        </div>
                        {selected.features && (
                          <div className="info-box">
                            <span className="info-lbl">Weight</span>
                            <span className="info-val">{selected.features.mol_weight?.toFixed(2)} g/mol</span>
                          </div>
                        )}
                        {selected.features && (
                          <div className="info-box">
                            <span className="info-lbl">LogP</span>
                            <span className="info-val">{selected.features.logP?.toFixed(3)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExplorePage;
