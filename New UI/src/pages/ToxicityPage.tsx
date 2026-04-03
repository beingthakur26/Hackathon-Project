import React from 'react';
import { ToxicityForm } from '../features/toxicity-check/ToxicityForm';
import { ToxicityResult } from '../features/toxicity-check/ToxicityResult';
import { FadeIn } from '../ui/animations/FadeIn';
import './ToxicityPage.css';

const ToxicityPage: React.FC = () => {
  return (
    <div className="toxicity-page">
      <div className="container">
        <FadeIn>
          <div className="page-header">
            <h1 className="page-title">Toxicity <em>Analysis</em>.</h1>
          </div>
        </FadeIn>

        <div className="toxicity-layout">
          <FadeIn delay={0.1}>
            <div className="toxicity-form-container">
              <ToxicityForm />
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="toxicity-result-container">
              <ToxicityResult />
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default ToxicityPage;
