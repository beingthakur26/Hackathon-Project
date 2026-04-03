import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer theme-dark">
      <div className="container footer__contact">
        <span className="footer__contact-label">HAVE ANY RESEARCH IN MIND?</span>
        <div className="footer__contact-row">
          <a href="mailto:hello@toxinai.com" className="footer__email">
            hello@toxinai.com
          </a>
          <Link to="/check">
            <Button variant="ghost" size="lg" className="footer__cta">
              Analyze Now →
            </Button>
          </Link>
        </div>
      </div>

      <div className="container footer__main">
        <div className="footer__brand">
          <span className="footer__copyright">© 2025 ToxinAI Scientific.</span>
          <p className="footer__brand-text">
            Work with our models, researchers, and<br />
            scientists who deliver high-quality insights<br />
            with passion.
          </p>
        </div>

        <div className="footer__nav">
          <div className="footer__nav-group">
            <span className="footer__nav-title">NAVIGATE</span>
            <Link to="/">Home</Link>
            <Link to="/check">Analyze</Link>
            <Link to="/explore">Explore</Link>
            <Link to="/agent">Agent</Link>
          </div>
          <div className="footer__nav-group">
            <span className="footer__nav-title">SOCIAL MEDIA</span>
            <a href="#">Instagram</a>
            <a href="#">Twitter (X)</a>
            <a href="#">LinkedIn</a>
            <a href="#">GitHub</a>
          </div>
        </div>
      </div>

      <div className="container footer__bottom">
        <h2 className="footer__logo-large">ToxinAI™</h2>
      </div>
    </footer>
  );
};
