import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const INTEREST_OPTIONS = [
'Technical', 'Cultural', 'Sports', 'Management', 'Music', 'Dance',
'Drama', 'Art', 'Photography', 'Gaming', 'Literature', 'Coding', 'Robotics'];


function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    collegeName: '',
    interests: [],
    followedClubs: [],
    participantType: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchRegistrations();
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const res = await axios.get('/api/participant/organizers');
      setOrganizers(res.data.organizers || []);
    } catch (error) {
      console.error('Error loading organizers:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/participant/profile');
      const user = res.data.user;
      setProfile(user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        contactNumber: user.contactNumber || '',
        collegeName: user.collegeName || '',
        interests: user.interests || [],
        followedClubs: user.followedClubs?.map((c) => c._id || c) || [],
        participantType: user.participantType || ''
      });
    } catch (error) {
      toast.error('Error loading profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const res = await axios.get('/api/participant/dashboard');
      setRegistrations(res.data.data?.registrations || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        contactNumber: formData.contactNumber,
        collegeName: formData.collegeName,
        interests: formData.interests,
        followedClubs: formData.followedClubs
      };
      await axios.put('/api/participant/profile', data);
      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwd.currentPassword || !pwd.newPassword) {
      toast.error('Please provide current and new password');
      return;
    }
    if (pwd.newPassword !== pwd.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (String(pwd.newPassword).length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setPwdSaving(true);
    try {
      await axios.put('/api/auth/password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword
      });
      toast.success('Password updated successfully');
      setPwd({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating password');
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!profile) return <div className="container"><p>Profile not found</p></div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>My Profile</h1>

      
      <div className="card" style={{ marginBottom: '20px' }}>
        {!editing ?
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <h2>Personal Information</h2>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> Participant</p>
              </div>
              <div>
                <p><strong>Type:</strong> {profile.participantType}</p>
                {profile.collegeName && <p><strong>College:</strong> {profile.collegeName}</p>}
                {profile.contactNumber && <p><strong>Contact:</strong> {profile.contactNumber}</p>}
              </div>
              <div>
                <p><strong>Interests:</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                  {profile.interests && profile.interests.length > 0 ?
                profile.interests.map((interest, index) =>
                <span key={index} style={{
                  padding: '4px 12px',
                  backgroundColor: '#e7f3ff',
                  color: '#004085',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}>
                        {interest}
                      </span>
                ) :

                <span style={{ color: '#6c757d' }}>No interests added</span>
                }
                </div>
              </div>
            </div>
          </> :

        <form onSubmit={handleSave}>
            <h2 style={{ marginBottom: '20px' }}>Edit Profile</h2>
            
            <div className="form-group">
              <label>First Name</label>
              <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required />

            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required />

            </div>

            <div className="form-group">
              <label>Participant Type</label>
              <input type="text" value={formData.participantType} disabled />
            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              placeholder="Required" />

            </div>

            <div className="form-group">
              <label>College</label>
              <input
              type="text"
              value={formData.collegeName}
              onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
              placeholder="Required" />

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
                <label>Follow Clubs/Organizers</label>
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditing(false);
                setFormData({
                  firstName: profile.firstName || '',
                  lastName: profile.lastName || '',
                  contactNumber: profile.contactNumber || '',
                  collegeName: profile.collegeName || '',
                  interests: profile.interests || [],
                  followedClubs: profile.followedClubs?.map((c) => c._id || c) || [],
                  participantType: profile.participantType || ''
                });
              }}>

                Cancel
              </button>
            </div>
          </form>
        }
      </div>

      
      {profile.followedClubs && profile.followedClubs.length > 0 &&
      <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '15px' }}>Followed Clubs ({profile.followedClubs.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {profile.followedClubs.map((club) =>
          <div key={club._id} style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 5px 0' }}>{club.organizerName}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>{club.category}</p>
              </div>
          )}
          </div>
        </div>
      }

      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Registered Events ({registrations.length || 0})</h2>
        {registrations && registrations.length > 0 ?
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {registrations.map((reg) =>
          <div
            key={reg._id}
            style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              cursor: 'pointer',
              border: reg.attended ? '2px solid #28a745' : 'none'
            }}
            onClick={() => reg.event?._id && navigate(`/events/${reg.event._id}`)}>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>{reg.event?.eventName || 'Event'}</h4>
                  {reg.attended &&
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
              }
                </div>
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#6c757d' }}>
                  {reg.event?.eventType} • {reg.event?.eligibility}
                </p>
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  📅 {reg.event?.eventStartDate ? new Date(reg.event.eventStartDate).toLocaleDateString() : '—'}
                </p>
                <p style={{ margin: '5px 0', fontSize: '13px' }}>
                  🎟️{' '}
                  <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/ticket/${reg.ticketId}`);
                }}>

                    {reg.ticketId}
                  </span>
                </p>
                {reg.attended ?
            <span style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '4px 12px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
                    Attended
                  </span> :

            <span style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '4px 12px',
              backgroundColor: '#fff3cd',
              color: '#856404',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
                    Not Attended Yet
                  </span>
            }
              </div>
          )}
          </div> :

        <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>No registered events yet</p>
        }
      </div>

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div className="stat-card">
          <h3>{registrations?.length || 0}</h3>
          <p>Total Registrations</p>
        </div>
        <div className="stat-card">
          <h3>{registrations?.filter((r) => r.attended).length || 0}</h3>
          <p>Events Attended</p>
        </div>
        <div className="stat-card">
          <h3>{profile.followedClubs?.length || 0}</h3>
          <p>Followed Clubs</p>
        </div>
      </div>

      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Security Settings</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label>Current Password *</label>
            <input
              type="password"
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              required />

          </div>

          <div className="form-group">
            <label>New Password *</label>
            <input
              type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              required />

          </div>

          <div className="form-group">
            <label>Confirm New Password *</label>
            <input
              type="password"
              value={pwd.confirmNewPassword}
              onChange={(e) => setPwd({ ...pwd, confirmNewPassword: e.target.value })}
              required />

          </div>

          <button type="submit" className="btn btn-primary" disabled={pwdSaving}>
            {pwdSaving ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>);

}

export default Profile;
