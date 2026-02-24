import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CATEGORY_OPTIONS = ['Technical', 'Cultural', 'Sports', 'Management', 'Other'];

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);

  const [formData, setFormData] = useState({
    organizerName: '',
    category: 'Technical',
    description: '',
    contactEmail: '',
    organizerContactNumber: '',
    discordWebhook: ''
  });

  const [resetReason, setResetReason] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/organizer/profile');
      const user = res.data.user;
      setProfile(user);
      setFormData({
        organizerName: user.organizerName || '',
        category: user.category || 'Technical',
        description: user.description || '',
        contactEmail: user.contactEmail || user.email || '',
        organizerContactNumber: user.organizerContactNumber || '',
        discordWebhook: user.discordWebhook || ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error loading profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        organizerName: formData.organizerName,
        category: formData.category,
        description: formData.description,
        contactEmail: formData.contactEmail,
        organizerContactNumber: formData.organizerContactNumber,
        discordWebhook: formData.discordWebhook
      };
      await axios.put('/api/organizer/profile', payload);
      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    if (!resetReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setRequestingReset(true);
    try {
      await axios.post('/api/organizer/password-reset-request', { reason: resetReason.trim() });
      toast.success('Password reset request submitted');
      setResetReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting request');
    } finally {
      setRequestingReset(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await axios.put('/api/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!profile) return <div className="container"><p>Profile not found</p></div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Organizer Profile</h1>

      <div className="card" style={{ marginBottom: '20px' }}>
        {!editing ?
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <h2>Organization Details</h2>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px' }}>
              <div>
                <p><strong>Organizer Name:</strong> {profile.organizerName || '—'}</p>
                <p><strong>Category:</strong> {profile.category || '—'}</p>
              </div>
              <div>
                <p><strong>Login Email:</strong> {profile.email}</p>
                <p><strong>Contact Email:</strong> {profile.contactEmail || '—'}</p>
                <p><strong>Contact Number:</strong> {profile.organizerContactNumber || '—'}</p>
              </div>
              <div>
                <p><strong>Status:</strong> {profile.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Discord Webhook:</strong> {profile.discordWebhook ? 'Configured' : 'Not set'}</p>
              </div>
            </div>

            {profile.description &&
          <div style={{ marginTop: '15px' }}>
                <p><strong>Description:</strong></p>
                <p style={{ marginTop: '6px', color: 'var(--muted-text)', lineHeight: '1.5' }}>
                  {profile.description}
                </p>
              </div>
          }
          </> :

        <form onSubmit={handleSave}>
            <h2 style={{ marginBottom: '20px' }}>Edit Profile</h2>

            <div className="form-group">
              <label>Organizer Name</label>
              <input
              type="text"
              value={formData.organizerName}
              onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
              required />

            </div>

            <div className="form-group">
              <label>Category</label>
              <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required>

                {CATEGORY_OPTIONS.map((cat) =>
              <option key={cat} value={cat}>{cat}</option>
              )}
              </select>
            </div>

            <div className="form-group">
              <label>Contact Email</label>
              <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="contact@yourorg.com" />

            </div>

            <div className="form-group">
              <label>Contact Number</label>
              <input
              type="tel"
              value={formData.organizerContactNumber}
              onChange={(e) => setFormData({ ...formData, organizerContactNumber: e.target.value })}
              placeholder="+91 9876543210" />

            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell participants what your organization does..." />

            </div>

            <div className="form-group">
              <label>Discord Webhook (optional)</label>
              <input
              type="url"
              value={formData.discordWebhook}
              onChange={(e) => setFormData({ ...formData, discordWebhook: e.target.value })}
              placeholder="https://discord.com/api/webhooks/..." />

            </div>

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
                  organizerName: profile.organizerName || '',
                  category: profile.category || 'Technical',
                  description: profile.description || '',
                  contactEmail: profile.contactEmail || profile.email || '',
                  organizerContactNumber: profile.organizerContactNumber || '',
                  discordWebhook: profile.discordWebhook || ''
                });
              }}>

                Cancel
              </button>
            </div>
          </form>
        }
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '10px' }}>Password Reset</h2>
        <p style={{ color: 'var(--muted-text)', marginBottom: '15px' }}>
          If you forgot your password, submit a request for the admin to reset it.
        </p>

        <form onSubmit={handlePasswordResetRequest}>
          <div className="form-group">
            <label>Reason</label>
            <textarea
              rows="3"
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              placeholder="e.g., Lost access to password manager"
              required />

          </div>

          <button type="submit" className="btn btn-primary" disabled={requestingReset}>
            {requestingReset ? 'Submitting...' : 'Request Password Reset'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h2 style={{ marginBottom: '10px' }}>Change Password</h2>
        <p style={{ color: 'var(--muted-text)', marginBottom: '15px' }}>
          After logging in with the temporary password, set a password you prefer.
        </p>

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required />

          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              minLength={6}
              required />

          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
              minLength={6}
              required />

          </div>

          <button type="submit" className="btn btn-primary" disabled={changingPassword}>
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>);

}

export default Profile;
