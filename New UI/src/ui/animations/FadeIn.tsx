import React from 'react';
import { motion, useInView } from 'framer-motion';

// ─── FadeIn: scroll-triggered fade-up animation ───
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  className = '',
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const directionMap = {
    up:    { y: 30, x: 0 },
    down:  { y: -30, x: 0 },
    left:  { y: 0, x: 40 },
    right: { y: 0, x: -40 },
    none:  { y: 0, x: 0 },
  };
  const { x, y } = directionMap[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y, x }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y, x }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

// ─── StaggerChildren: animates children one-by-one ───
interface StaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerChildren: React.FC<StaggerProps> = ({
  children,
  staggerDelay = 0.1,
  className = '',
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden:  { opacity: 0, y: 24 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
