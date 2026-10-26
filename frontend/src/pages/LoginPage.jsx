import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SparklesIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleRedirect = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'serviceCenter':
        navigate('/service-center');
        break;
      case 'owner':
      default:
        navigate('/owner');
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user?.name || 'User'}!`);
      
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from);
      } else {
        handleRoleRedirect(user?.role);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick fill helper for testers
  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col justify-center items-center px-4 relative overflow-hidden py-12">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 group mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
            RepairChain
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Sign In to Your Account</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Access your hardware assets, service logs, and passport data
        </p>
      </div>

      {/* Glassmorphism Card */}
      <div className="card-glass w-full max-w-md relative z-10 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <EnvelopeIcon className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input pl-10"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <LockClosedIcon className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary py-3 rounded-lg font-bold flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials shortcut */}
        <div className="mt-6 pt-5 border-t border-navy-700/80">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 text-center mb-2">
            Demo Credentials Quick Fill
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('admin@repairchain.io', 'Admin123!')}
              className="px-2 py-1.5 bg-navy-900/80 hover:bg-navy-700 border border-navy-700 rounded text-violet-300 text-center transition-colors text-[11px]"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('service@repairchain.io', 'Service123!')}
              className="px-2 py-1.5 bg-navy-900/80 hover:bg-navy-700 border border-navy-700 rounded text-cyan-300 text-center transition-colors text-[11px]"
            >
              Service
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('owner@repairchain.io', 'Owner123!')}
              className="px-2 py-1.5 bg-navy-900/80 hover:bg-navy-700 border border-navy-700 rounded text-emerald-300 text-center transition-colors text-[11px]"
            >
              Owner
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
