import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import TurnstileWidget from '../components/TurnstileWidget';

const INTEREST_OPTIONS = [
'Technical', 'Cultural', 'Sports', 'Management', 'Music', 'Dance',
'Drama', 'Art', 'Photography', 'Gaming', 'Literature', 'Coding', 'Robotics'];


function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    participantType: 'IIIT',
    collegeName: '',
    contactNumber: '',
    interests: [],
    followedClubs: []
  });
  const [loading, setLoading] = useState(false);
  const [organizers, setOrganizers] = useState([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  const siteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;
  const captchaEnabled = Boolean(siteKey);
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {

    const fetchOrganizers = async () => {
      try {
        const response = await fetch('/api/participant/organizers');
        if (response.ok) {
          const data = await response.json();
          setOrganizers(data.organizers || []);
        }
      } catch (error) {
        console.error('Failed to fetch organizers:', error);
      }
    };
    fetchOrganizers();
  }, []);



  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest) ?
      prev.interests.filter((i) => i !== interest) :
      [...prev.interests, interest]
    }));
  };

  const handleClubToggle = (clubId) => {
    setFormData((prev) => ({
      ...prev,
      followedClubs: prev.followedClubs.includes(clubId) ?
      prev.followedClubs.filter((id) => id !== clubId) :
      [...prev.followedClubs, clubId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (captchaEnabled && !captchaToken) {
      toast.error('Please complete the CAPTCHA');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registrationData } = formData;
    registrationData.captchaToken = captchaToken;
    const result = await register(registrationData);

    if (result.success) {
      toast.success('Registration successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '50px' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Register for Felicity</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Participant Type</label>
            <select name="participantType" value={formData.participantType} onChange={handleChange} required>
              <option value="IIIT">IIIT Student</option>
              <option value="Non-IIIT">Non-IIIT Participant</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John" />

            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe" />

            </div>
          </div>

          <div className="form-group">
            <label>
              Email{' '}
              {formData.participantType === 'IIIT' && '(@iiit.ac.in / @students.iiit.ac.in / @research.iiit.ac.in)'}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={formData.participantType === 'IIIT' ? 'john.doe@students.iiit.ac.in' : 'john.doe@example.com'} />

          </div>

          <div className="form-group">
            <label>College/Organization Name</label>
            <input
              type="text"
              name="collegeName"
              value={formData.collegeName}
              onChange={handleChange}
              required
              placeholder="IIIT Hyderabad" />

          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              placeholder="9876543210" />

          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Minimum 6 characters" />

          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password" />

          </div>

          <div className="form-group">
            <label>Interests (Select all that apply)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop: '8px' }}>
              {INTEREST_OPTIONS.map((interest) =>
              <label key={interest} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                  <input
                  type="checkbox"
                  checked={formData.interests.includes(interest)}
                  onChange={() => handleInterestToggle(interest)}
                  style={{ marginRight: '6px' }} />

                  {interest}
                </label>
              )}
            </div>
          </div>

          {organizers.length > 0 &&
          <div className="form-group">
              <label>Follow Clubs/Organizers (Optional)</label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px', marginTop: '8px' }}>
                {organizers.map((org) =>
              <label key={org._id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px', fontSize: '14px' }}>
                    <input
                  type="checkbox"
                  checked={formData.followedClubs.includes(org._id)}
                  onChange={() => handleClubToggle(org._id)}
                  style={{ marginRight: '8px' }} />

                    <span style={{ fontWeight: '500' }}>{org.organizerName}</span>
                    <span style={{ marginLeft: '8px', color: '#6c757d', fontSize: '12px' }}>({org.category})</span>
                  </label>
              )}
              </div>
            </div>
          }

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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>);

}

export default Register;
