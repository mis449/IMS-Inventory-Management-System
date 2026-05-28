import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import parekhLogo from '../Assets/images.png';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const cleanId = id.trim().toLowerCase();

      // Check if table is empty to auto-seed defaults
      const { count, error: countErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (!countErr && (count === 0 || count === null)) {
        console.log('Seeding default users into Supabase...');
        const defaultUsers = [
          { id: 'admin', name: 'Admin User', password: 'admin123', role: 'ADMIN' },
          { id: 'user', name: 'Employee 1', password: 'user123', role: 'USER' },
          { id: 'user2', name: 'Employee 2', password: 'user123', role: 'USER' }
        ];
        await supabase.from('users').insert(defaultUsers);
      }

      // Query database for credentials match by username or email
      const { data: matchedUser, error } = await supabase
        .from('users')
        .select('*')
        .or(`user_name.eq.${id.trim()},email_id.eq.${id.trim()}`)
        .eq('password', password)
        .maybeSingle();

      if (error) throw error;

      if (!matchedUser) {
        toast.error('Invalid credentials');
        setSubmitting(false);
        return;
      }

      toast.success('Login successful!');
      login(matchedUser);
      navigate("/", { replace: true });
    } catch (err) {
      console.error('Authentication error:', err);
      toast.error('Connection error with Supabase database.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-tr from-sky-50/50 via-white to-sky-100/40 relative overflow-hidden">
      
      {/* Background decorative circles for premium SaaS feel */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-sky-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-sky-100/30 blur-3xl pointer-events-none" />

      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-sky-100/30 p-8 space-y-8 border border-white/80 transition-all hover:shadow-2xl">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-600 p-0.5 shadow-lg shadow-sky-200/50 flex items-center justify-center transform hover:rotate-3 transition-transform">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center p-2.5">
                <img
                  src={parekhLogo}
                  alt="Parekh Gallerium Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory</h1>
              <p className="text-sky-600 text-xs font-black uppercase tracking-widest">Management System</p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User ID Input */}
            <div className="space-y-2">
              <label htmlFor="id" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                User ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="text-slate-400" size={18} />
                </div>
                <input
                  id="id"
                  name="id"
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-[14px] shadow-sm"
                  placeholder="Enter user ID or email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-slate-400" size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-[14px] shadow-sm"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-4 text-xs uppercase tracking-widest font-black bg-sky-600 text-white rounded-xl hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500/20 transition-all active:scale-95 shadow-md shadow-sky-200/50 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Footer at Bottom */}
      <div className="py-6 text-center relative z-10 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
          Powered by <span className="font-extrabold text-sky-600">Parekh Gallerium</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
