import React from 'react';
import './Badge.css';

type BadgeVariant = 'toxic' | 'safe' | 'warning' | 'info' | 'default' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  dot = false,
}) => {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
};
