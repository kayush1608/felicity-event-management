import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function ManageOrganizers() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    organizerName: '',
    category: 'Technical',
    description: '',
    contactEmail: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const res = await axios.get('/api/admin/organizers');
      setOrganizers(res.data.organizers);
    } catch (error) {
      toast.error('Error loading organizers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await axios.post('/api/admin/organizers', formData);
      toast.success(`Organizer created! Credentials sent to ${formData.contactEmail}`);
      toast.info(`Temp Password: ${res.data.organizer.temporaryPassword}`, { autoClose: 10000 });
      setFormData({ organizerName: '', category: 'Technical', description: '', contactEmail: '' });
      setShowForm(false);
      fetchOrganizers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating organizer');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`/api/admin/organizers/${id}/status`, { isActive: !currentStatus });
      toast.success(`Organizer ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchOrganizers();
    } catch (error) {
      toast.error('Error updating organizer status');
    }
  };

  const deleteOrganizer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/organizers/${id}`);
      toast.success('Organizer deleted successfully');
      fetchOrganizers();
    } catch (error) {
      toast.error('Error deleting organizer');
    }
  };

  if (loading) return <div className="loading">Loading organizers...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Manage Clubs & Organizers</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add New Organizer'}
        </button>
      </div>

      {showForm &&
      <div className="card" style={{ marginBottom: '30px' }}>
          <h2>Create New Organizer</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Organizer Name *</label>
              <input
              type="text"
              name="organizerName"
              value={formData.organizerName}
              onChange={handleChange}
              required
              placeholder="e.g., Programming Club, Cultural Council" />

            </div>

            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Management">Management</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Contact Email *</label>
              <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              placeholder="club@example.com" />

              <small>Login credentials will be sent to this email</small>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Brief description of the organizer" />

            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Organizer'}
            </button>
          </form>
        </div>
      }

      <div className="card">
        <h2>All Organizers ({organizers.length})</h2>
        {organizers.length === 0 ?
        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No organizers found. Create one to get started!</p> :

        <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizers.map((org) =>
            <tr key={org._id}>
                  <td><strong>{org.organizerName}</strong></td>
                  <td><span className="badge badge-normal">{org.category}</span></td>
                  <td>{org.email}</td>
                  <td>
                    <span className={`badge ${org.isActive ? 'badge-published' : 'badge-closed'}`}>
                      {org.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(org.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                  className={`btn ${org.isActive ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => toggleStatus(org._id, org.isActive)}>

                      {org.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                  className="btn btn-danger"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => deleteOrganizer(org._id, org.organizerName)}>

                      Delete
                    </button>
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        }
      </div>
    </div>);

}

export default ManageOrganizers;
