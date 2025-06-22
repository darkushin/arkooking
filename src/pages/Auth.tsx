import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';

type AuthView = 'login' | 'signup' | 'forgot_password';

const Auth = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user, enterGuestMode, isGuest } = useAuth();

  useEffect(() => {
    // Redirect if user is logged in or is a guest
    if (user || isGuest) {
      navigate('/');
    }
  }, [user, isGuest, navigate]);

  const handleGuestLogin = () => {
    enterGuestMode();
    navigate('/');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setError('');
      alert('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    const redirectUrl = `${window.location.origin}/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a password reset link.');
    }
    setLoading(false);
  };

  const renderView = () => {
    switch (view) {
      case 'forgot_password':
        return (
          <>
            <p className="text-amber-700 text-center mb-8">
              Enter your email to receive a reset link.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-amber-800">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>

              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm">{message}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={() => setView('login')}
                className="text-amber-700 hover:text-amber-800 underline"
              >
                Back to Sign In
              </button>
            </div>
          </>
        );
      case 'signup':
      case 'login':
      default:
        const isLogin = view === 'login';
        return (
          <>
            <p className="text-amber-700 text-center mb-8">
                {isLogin ? 'Welcome back!' : 'Create your account'}
            </p>
            <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="fullName" className="text-amber-800">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                    className="mt-1"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-amber-800">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-amber-800">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setView('forgot_password')}
                    className="text-sm text-amber-700 hover:text-amber-800 underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl"
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setView(isLogin ? 'signup' : 'login');
                  setError('');
                  setEmail('');
                  setPassword('');
                  setFullName('');
                }}
                className="text-amber-700 hover:text-amber-800 underline"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            <div className="mt-6 text-center pt-4 border-t border-amber-200">
               <Button
                onClick={handleGuestLogin}
                variant="ghost"
                className="text-amber-700 hover:text-amber-800"
              >
                Continue as Guest
              </Button>
            </div>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-dancing-script text-amber-900">arkooking</h1>
        </div>
        {renderView()}
      </div>
    </div>
  );
};

export default Auth;
