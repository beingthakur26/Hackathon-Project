import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { Input } from '../ui/components/Input';
import { Button } from '../ui/components/Button';
import './AuthPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="auth-header">
            <Link to="/" className="auth-logo">ToxinAI™</Link>
            <h1 className="auth-title">Welcome <em>back</em>.</h1>
            <p className="auth-subtitle">Sign in to access your laboratory records.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <Input
                id="login-email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="researcher@university.edu"
                icon={<Mail size={18} />}
                fullWidth
                required
              />
            </div>
            <div className="form-group">
              <Input
                id="login-password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="••••••••"
                icon={<Lock size={18} />}
                fullWidth
                required
                error={error || undefined}
              />
            </div>
            
            <div className="auth-actions">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                fullWidth
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="auth-footer">
            <p>
              New to ToxinAI? <Link to="/register" className="auth-link">Create Account</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
