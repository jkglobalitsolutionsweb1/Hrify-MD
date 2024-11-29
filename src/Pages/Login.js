import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { logo } from '../assets/images';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedEmail = localStorage.getItem('userEmail');
    const savedPassword = localStorage.getItem('userPassword');

    if (savedUser && savedEmail === 'jkglobalitmd@gmail.com' && savedPassword === '123456') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (email === 'jkglobalitmd@gmail.com' && password === '123456') {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPassword', password);
        
        navigate('/dashboard');
      } catch (err) {
        setError('Authentication failed. Please check your credentials.');
      }
    } else {
      setError('Invalid email or password.');
    }

    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="container-fluid d-flex flex-column justify-content-center align-items-center min-vh-100"
      style={{ background: 'linear-gradient(to top, #FFFFFF 50%, #FF0000 50%)' }}>
      
      {/* Logo */}
      <div className="mb-4 text-center row justify-content-center" style={{ width: '100%' }}>
        <img 
          src={logo} 
          alt="Logo" 
          className="img-fluid text-center" 
          style={{ 
            maxWidth: '140px', 
            position: 'absolute', 
            top: '20px', 
            left: '20px',
            '@media (max-width: 768px)': {
              position: 'static',
              marginBottom: '20px'
            }
          }} 
        />
      </div>

      <div className="card shadow-sm p-4" style={{ maxWidth: '430px', width: '100%' }}>
        <h2 className="mb-4 text-center" style={{ fontWeight: 'bold' }}>Login</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control border-danger p-2"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3 position-relative">
            <input
              type={passwordVisible ? 'text' : 'password'}
              className="form-control border-danger p-2"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn fw-bold position-absolute top-50 end-0 translate-middle-y me-2"
              style={{ height: '80%', padding: '0 10px' }}
              onClick={togglePasswordVisibility}
            >
              {passwordVisible ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="d-grid">
            <button 
              className="btn btn-danger p-2" 
              type="submit" 
              style={{ backgroundColor: '#FF0000' }}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>

      {isLoading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

