import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from './Button';
import './Navbar.css';

const navLinks = [
  { to: '/check', label: 'Analyze' },
  { to: '/batch', label: 'Batch' },
  { to: '/lab', label: 'Lab' },
  { to: '/explore', label: 'Explore' },
  { to: '/agent', label: 'AI Agent' },
  { to: '/dashboard', label: 'Dashboard' },
];

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__inner">
          <Link to="/" className="navbar__logo">
            ToxinAI™
          </Link>

          <nav className="navbar__links">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`${link.label == "Lab" ? "navbar__special" :"navbar__link"} ${pathname.startsWith(link.to) ? 'navbar__link--active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="navbar__actions">
            <Link to="/login" className="navbar__cta-desktop">
              <Button variant="primary" size="sm">
                Get Connected
              </Button>
            </Link>
            <button className="navbar__burger" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-drawer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <nav className="mobile-drawer__links">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className="mobile-drawer__link">
                  {link.label}
                </Link>
              ))}
              <Link to="/login" className="mobile-drawer__link mobile-drawer__link--cta">
                Get Connected
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
