import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { FadeIn } from '../animations/FadeIn';
import './CTASection.css';

export const CTASection: React.FC = () => {
  return (
    <section className="mission-section section">
      <div className="container mission-section__inner">
        <FadeIn>
          <div className="mission-section__content">
            <h2 className="mission-section__text">
              We started with <em>one mission</em>: create models that don't just predict—but explain.
            </h2>
            <Link to="/explore" className="mission-section__link">
              See Our Library <ArrowUpRight size={20} />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
