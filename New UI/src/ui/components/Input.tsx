import React, { forwardRef } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, multiline = false, rows = 4, icon, fullWidth = false, className = '', id, ...rest }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 7)}`;

    return (
      <div className={`input-wrap ${fullWidth ? 'input-wrap--full' : ''} ${error ? 'input-wrap--error' : ''} ${className}`}>
        {label && (
          <label className="input-label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className="input-inner">
          {icon && <span className="input-icon">{icon}</span>}
          {multiline ? (
            <textarea
              id={inputId}
              className={`input ${icon ? 'input--with-icon' : ''}`}
              rows={rows}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              id={inputId}
              className={`input ${icon ? 'input--with-icon' : ''}`}
              ref={ref as React.Ref<HTMLInputElement>}
              {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
        </div>
        {error && <span className="input-error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
