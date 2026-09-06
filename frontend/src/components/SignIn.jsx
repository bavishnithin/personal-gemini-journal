import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../services/firebase';

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="center-screen">
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h2>Personal Gemini Journal</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Your private, AI-powered reflection space.
        </p>

        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" className="primary" style={{ width: '100%', marginBottom: '10px' }} disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={{ margin: '15px 0', color: 'var(--text-secondary)' }}>OR</div>

        <button onClick={handleGoogleSignIn} style={{ width: '100%', marginBottom: '20px' }}>
          Sign In with Google
        </button>

        <p style={{ fontSize: '0.9em' }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          {' '}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); setIsSignUp(!isSignUp); }}
            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </a>
        </p>
      </div>
    </div>
  );
}
