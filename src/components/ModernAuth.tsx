// src/components/ModernAuth.tsx
import { useState } from 'react';
import { supabase } from '../lib/lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Clock, Lock, Mail, AlertCircle } from 'lucide-react';

export default function ModernAuth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Error logging in. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-md p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-surface text-primary mb-4">
            <Clock size={32} />
          </div>
          <h1 className="text-3xl font-semibold">FinancePro</h1>
          <p className="text-text-secondary mt-2">Sign in to access your budgets</p>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Welcome Back</h2>
            <p className="card-subtitle">Enter your credentials to continue</p>
          </div>
          <div className="card-content">
            {error && (
              <div className="bg-error-surface text-error rounded-md p-4 mb-6 flex items-center">
                <AlertCircle className="mr-2" size={18} />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="form-group">
                <Label htmlFor="email" className="form-label">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-text-tertiary" size={16} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="form-label">Password</Label>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-text-tertiary" size={16} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-text-secondary text-sm">
            Don't have an account?{' '}
            <a href="#" className="text-primary hover:underline">
              Contact your administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}