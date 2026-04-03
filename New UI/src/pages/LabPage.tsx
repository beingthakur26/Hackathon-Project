import React from 'react';
import { LabManager } from '../features/chemistry-lab/LabManager';
import { motion } from 'framer-motion';
import './LabPage.css';

export const LabPage: React.FC = () => {
  return (
    <motion.div 
      className="lab-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <header className="lab-header">
        <div className="lab-header__content">
          <h1 className="lab-title">Chemistry Lab</h1>
          <p className="lab-subtitle">Interactive molecular synthesis and design workspace.</p>
        </div>
      </header>

      <main className="lab-main">
        <LabManager />
      </main>
    </motion.div>
  );
};

export default LabPage;
