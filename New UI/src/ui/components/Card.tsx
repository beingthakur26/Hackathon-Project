import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'md',
  onClick,
}) => {
  return (
    <motion.div
      className={`card card--pad-${padding} ${hover ? 'card--hover' : ''} ${glow ? 'card--glow' : ''} ${className}`}
      whileHover={hover ? { y: -4 } : {}}
      transition={{ duration: 0.25 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
