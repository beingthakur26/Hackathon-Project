import React from 'react';
import { FadeIn, StaggerChildren } from '../animations/FadeIn';
import './StatsSection.css';

const stats = [
  { value: '15+', label: 'Years Research' },
  { value: '50k+', label: 'Molecules Tested' },
  { value: '20+', label: 'Global Patents' },
  { value: '100%', label: 'AI Accuracy' },
];

export const StatsSection: React.FC = () => {
  return (
    <section className="stats-section section">
      <div className="container">
        <FadeIn>
          <div className="stats-section__header">
            <span className="stats-section__label">AGENCY MILESTONES</span>
          </div>
        </FadeIn>

        <StaggerChildren className="stats-section__grid" staggerDelay={0.1}>
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-card__value">{stat.value}</div>
              <div className="stat-card__label">{stat.label}</div>
            </div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};
