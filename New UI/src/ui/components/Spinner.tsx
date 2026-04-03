import React from 'react';
import './Spinner.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'cyan' | 'white';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'blue' }) => {
  return (
    <div className={`spinner spinner--${size} spinner--${color}`} role="status" aria-label="Loading" />
  );
};

interface PageLoaderProps {
  text?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ text = 'Loading…' }) => (
  <div className="page-loader">
    <p className="page-loader__text">{text}</p>
  </div>
);
