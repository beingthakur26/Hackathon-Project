import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FlaskConical } from 'lucide-react';
import { Input } from '../../ui/components/Input';
import { Button } from '../../ui/components/Button';
import { EXAMPLE_SMILES } from '../../app/config';
import { useToxicityStore } from './useToxicityStore';
import './ToxicityForm.css';

export const ToxicityForm: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [smiles, setSmiles] = useState(() => searchParams.get('smiles') || '');
  const { predict, loading, error, clear } = useToxicityStore();

  // Update SMILES when URL params change
  useEffect(() => {
    const urlSmiles = searchParams.get('smiles');
    if (urlSmiles && urlSmiles !== smiles) {
      setSmiles(urlSmiles);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smiles.trim()) return;
    await predict(smiles.trim());
  };

  const handleExample = (s: string) => {
    setSmiles(s);
    setSearchParams({ smiles: s });
    clear();
  };

  return (
    <div className="toxicity-form">
      <div className="toxicity-form__header">
        <h2 className="toxicity-form__title">Compound Input</h2>
        <p className="toxicity-form__subtitle">
          Input your chemical structure in SMILES notation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="toxicity-form__body">
        <div className="smiles-input-wrapper">
          <Input
            id="smiles-input"
            value={smiles}
            onChange={(e) => setSmiles((e.target as HTMLInputElement).value)}
            placeholder="e.g., CC(=O)OC1=CC=CC=C1C(=O)O"
            icon={<Search size={18} />}
            error={error || undefined}
            fullWidth
          />
        </div>

        <div className="toxicity-form__examples">
          <span className="examples-label">Try an example:</span>
          <div className="examples-list">
            {EXAMPLE_SMILES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className={`example-item ${smiles === ex.smiles ? 'is-active' : ''}`}
                onClick={() => handleExample(ex.smiles)}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="toxicity-form__actions">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            fullWidth
          >
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </Button>
          {smiles && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="clear-btn"
              onClick={() => { setSmiles(''); clear(); }}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      <div className="toxicity-form__footer">
        <div className="disclaimer">
          <FlaskConical size={14} />
          <span>Research purpose only. Probabilistic AI model.</span>
        </div>
      </div>
    </div>
  );
};
