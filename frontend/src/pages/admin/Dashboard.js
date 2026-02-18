import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('/api/admin/dashboard');
      setStats(res.data.data);
    } catch (error) {
      toast.error('Error loading dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await axios.put('/api/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully!');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Admin Dashboard</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{stats?.totalParticipants || 0}</h3>
          <p>Total Participants</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.totalOrganizers || 0}</h3>
          <p>Total Organizers</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.activeOrganizers || 0}</h3>
          <p>Active Organizers</p>
        </div>
        <div className="stat-card">
          <h3 style={{ color: stats?.pendingPasswordResets > 0 ? '#dc3545' : '#007bff' }}>
            {stats?.pendingPasswordResets || 0}
          </h3>
          <p>Pending Password Resets</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div className="card">
          <h2 style={{ marginBottom: '15px' }}>Quick Actions</h2>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={() => navigate('/manage-organizers')}>

            Manage Organizers
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={() => navigate('/password-resets')}>

            View Password Resets {stats?.pendingPasswordResets > 0 && `(${stats.pendingPasswordResets})`}
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setShowPasswordForm(!showPasswordForm)}>

            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '15px' }}>System Status</h2>
          <div style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px', marginBottom: '10px' }}>
            <p style={{ margin: '0', color: '#155724' }}><strong>✓</strong> System Online</p>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px', marginBottom: '10px' }}>
            <p style={{ margin: '0', color: '#155724' }}><strong>✓</strong> Database Connected</p>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
            <p style={{ margin: '0', color: '#155724' }}><strong>✓</strong> All Services Running</p>
          </div>
        </div>
      </div>

      {showPasswordForm &&
      <div className="card" style={{ marginTop: '30px' }}>
          <h2 style={{ marginBottom: '15px' }}>Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password</label>
              <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
              placeholder="Enter current password" />

            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              minLength="6"
              placeholder="Enter new password (min 6 characters)" />

            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
              placeholder="Re-enter new password" />

            </div>
            <button type="submit" className="btn btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      }

      <div className="card" style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '15px' }}>Admin Information</h2>
        <p><strong>Role:</strong> System Administrator</p>
        <p><strong>Access Level:</strong> Full System Access</p>
        <p><strong>Responsibilities:</strong></p>
        <ul>
          <li>Create and manage organizer accounts</li>
          <li>Handle password reset requests</li>
          <li>Monitor system activity</li>
          <li>Manage user access and permissions</li>
        </ul>
      </div>
    </div>);

}

export default Dashboard;
