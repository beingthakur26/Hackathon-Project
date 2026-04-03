import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeIn } from '../animations/FadeIn';
import { Button } from '../components/Button';
import './HeroSection.css';

export const HeroSection: React.FC = () => {
  return (
    <section className="hero">
      <div className="hero__blob hero__blob--blue" />
      <div className="hero__blob hero__blob--purple" />

      <div className="container hero__content">
        <FadeIn delay={0.2}>
          <h1 className="hero__heading">ToxinAI™</h1>
        </FadeIn>

        <FadeIn delay={0.35}>
          <p className="hero__description">
            Predict molecular toxicity with laboratory-grade precision. 
            Instant screening for drug discovery and chemical research.
          </p>
        </FadeIn>

        <FadeIn delay={0.45}>
          <div className="hero__actions">
            <Link to="/check">
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={20} />}>
                Start Analysis
              </Button>
            </Link>
            <Link to="/agent">
              <Button variant="secondary" size="lg">
                Talk to Agent
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
