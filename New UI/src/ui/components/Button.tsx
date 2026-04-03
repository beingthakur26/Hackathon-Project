import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...rest
}) => {
  return (
    <motion.button
      className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${className}`}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || loading}
      {...(rest as object)}
    >
      {loading ? (
        <span className="btn__spinner" />
      ) : (
        <>
          {icon && <span className="btn__icon btn__icon--left">{icon}</span>}
          <span className="btn__label">{children}</span>
          {iconRight && <span className="btn__icon btn__icon--right">{iconRight}</span>}
        </>
      )}
    </motion.button>
  );
};
