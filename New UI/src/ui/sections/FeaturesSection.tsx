import React from 'react';
import { Plus } from 'lucide-react';
import { FadeIn, StaggerChildren } from '../animations/FadeIn';
import './FeaturesSection.css';

const features = [
  {
    id: '01.',
    title: 'SMILES Analysis',
    desc: 'Input any SMILES string and instantly extract 20+ molecular descriptors using RDKit algorithms.',
    tags: ['RDKit', 'Molecular Descriptors', 'Chemical Analysis'],
  },
  {
    id: '02.',
    title: 'ML Toxicity Prediction',
    desc: 'Our RandomForest model, trained on thousands of curated compounds, predicts toxicity with high accuracy.',
    tags: ['Machine Learning', 'RandomForest', 'Bio-Informatics'],
  },
  {
    id: '03.',
    title: 'AI Chemical Agent',
    desc: 'Chat with an expert AI agent to get molecular insights, explain results, and suggest optimizations.',
    tags: ['LLM', 'LangChain', 'Intelligent Insights'],
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="features-section section">
      <div className="container">
        <FadeIn>
          <div className="features-section__header">
            <span className="features-section__label">SERVICE — 02</span>
            <h2 className="features-section__heading">
              A platform that brings<br />
              <em>precision</em> into every discovery.
            </h2>
          </div>
        </FadeIn>

        <StaggerChildren className="features-list" staggerDelay={0.1}>
          {features.map((f) => (
            <div key={f.title} className="feature-item">
              <div className="feature-item__main">
                <span className="feature-item__id">{f.id}</span>
                <div className="feature-item__content">
                  <h3 className="feature-item__title">{f.title}</h3>
                  <p className="feature-item__desc">{f.desc}</p>
                  <div className="feature-item__tags">
                    {f.tags.map(tag => <span key={tag} className="feature-item__tag">{tag}</span>)}
                  </div>
                </div>
                <div className="feature-item__icon">
                  <Plus size={20} />
                </div>
              </div>
            </div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};
