import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth({ setAuthToken, setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'reporter'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setAuthToken(data.token);
      setUser(data.user);

      if (data.user.role === 'collector') {
        navigate('/map');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-3 sm:p-6 bg-slate-50 w-full animate-in fade-in duration-300">
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-5 sm:mb-6 text-slate-800">
          {isLogin ? 'Welcome Back' : 'Join EcoSmart'}
        </h2>
        
        {error && <div className="mb-4 text-xs sm:text-sm text-red-600 bg-red-50 p-3 rounded-lg font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required className="mt-1 w-full p-2.5 sm:p-3 border border-slate-300 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
          )}
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 w-full p-2.5 sm:p-3 border border-slate-300 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 w-full p-2.5 sm:p-3 border border-slate-300 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700">I want to...</label>
              <select name="role" value={formData.role} onChange={handleChange} className="mt-1 w-full p-2.5 sm:p-3 border border-slate-300 rounded-xl text-sm bg-white outline-none">
                <option value="reporter">Report Waste</option>
                <option value="collector">Clean up Waste</option>
              </select>
            </div>
          )}

          <button type="submit" className="w-full py-3 sm:py-3.5 bg-primary-600 text-white rounded-xl text-sm sm:text-base font-semibold hover:bg-primary-700 transition shadow-md hover:shadow-primary-500/20">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary-600 font-medium hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
