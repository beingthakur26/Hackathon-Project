import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeIn, StaggerChildren } from '../animations/FadeIn';
import { Button } from '../components/Button';
import './HowItWorksSection.css';

const steps = [
  {
    num: '01',
    title: 'SMILES Input',
    desc: 'Enter any chemical compound notation. Our system supports standard SMILES and IUPAC names.',
  },
  {
    num: '02',
    title: 'Molecular Feature Extraction',
    desc: 'We extract 20+ key physical and chemical descriptors using high-fidelity RDKit algorithms.',
  },
  {
    num: '03',
    title: 'AI Model Processing',
    desc: 'Our trained RandomForest model classifies toxicity with rapid precision and high confidence.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="hiw-section section">
      <div className="container">
        <FadeIn>
          <div className="hiw-section__header">
            <span className="hiw-section__label">PROCESS — 03</span>
            <h2 className="hiw-section__heading">
              From notation to <em>results</em><br />
              in milliseconds.
            </h2>
          </div>
        </FadeIn>

        <StaggerChildren className="hiw-steps" staggerDelay={0.1}>
          {steps.map((step) => (
            <div key={step.num} className="hiw-step">
              <div className="hiw-step__num">{step.num}</div>
              <div className="hiw-step__body">
                <h3 className="hiw-step__title">{step.title}</h3>
                <p className="hiw-step__desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </StaggerChildren>

        <FadeIn delay={0.3}>
          <div className="hiw-cta">
            <Link to="/check">
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
                Try Analysis
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
