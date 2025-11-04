
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && email) {
      setIsLoading(true);
      await onLogin(email);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-cyan-400">Gemini Time Tracker</h1>
            <p className="mt-2 text-slate-400">Welcome! Please sign in to continue.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none placeholder-slate-500"
              placeholder="you@example.com"
            />
             <p className="mt-2 text-xs text-slate-500">Use a valid user email from the system to sign in (e.g., admin@example.com).</p>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-transform transform hover:scale-105 disabled:bg-cyan-800/50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
