import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../features/auth/useAuthStore';
import { Input } from '../ui/components/Input';
import { Button } from '../ui/components/Button';
import './AuthPage.css';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await register(name, email, password);
    if (ok) navigate('/dashboard');
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
            <h1 className="auth-title">Create <em>account</em>.</h1>
            <p className="auth-subtitle">Join our research network to start analyzing compounds.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <Input
                id="reg-name"
                label="Name"
                value={name}
                onChange={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="Your full name"
                icon={<User size={18} />}
                fullWidth
                required
              />
            </div>
            <div className="form-group">
              <Input
                id="reg-email"
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
                id="reg-password"
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
                {loading ? 'Registering...' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
