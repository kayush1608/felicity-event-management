import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import loginBgLight from '../assets/login-bg-light.png';
import TurnstileWidget from '../components/TurnstileWidget';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;
  const captchaEnabled = Boolean(siteKey);

  const backgroundImage = loginBgLight;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (captchaEnabled && !captchaToken) {
      toast.error('Please complete the CAPTCHA');
      return;
    }

    setLoading(true);

    const result = await login(email, password, captchaToken);

    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div
      className="auth-page"
      style={{ '--auth-bg-image': `url(${backgroundImage})`, '--auth-bg-blur': '8px' }}>

      <div className="container" style={{ maxWidth: '400px' }}>
        <div className="card">
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Login to Felicity</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email" />

            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password" />

            </div>

            {captchaEnabled &&
            <div className="form-group">
                <TurnstileWidget
                siteKey={siteKey}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken('')}
                onError={() => {
                  setCaptchaToken('');
                  toast.error('CAPTCHA failed to load');
                }} />

              </div>
            }
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>);

}

export default Login;
