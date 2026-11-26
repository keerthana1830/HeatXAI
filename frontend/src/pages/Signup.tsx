import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Mail, User, Shield, Flame, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';

interface SignupProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Signup: React.FC<SignupProps> = ({ theme, toggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authService.signup(email, password, fullName, role);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden px-4">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl dark:bg-blue-600/5 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl dark:bg-orange-600/5 animate-pulse delay-1000" />

      {/* Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:scale-105 transition-transform"
      >
        {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-md glass-card p-8 rounded-2xl relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl shadow-lg mb-3">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Thermacity</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Urban Heat Intelligence Platform</p>
        </div>

        <h2 className="text-xl font-semibold mb-6 text-center text-slate-800 dark:text-slate-200">Create Account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-500 text-sm rounded-lg text-center font-medium">
            Signup successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-950 dark:text-white placeholder-slate-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-950 dark:text-white placeholder-slate-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-950 dark:text-white placeholder-slate-400 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-950 dark:text-white placeholder-slate-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">System Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input bg-white/70 dark:bg-slate-900/50 text-slate-950 dark:text-white text-sm appearance-none cursor-pointer"
              >
                <option value="user" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Standard User</option>
                <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Admin Officer</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 dark:shadow-none hover:shadow-xl hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 font-semibold underline decoration-2 underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
