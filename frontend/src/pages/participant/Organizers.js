import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Organizers() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [followedOnly, setFollowedOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const res = await axios.get('/api/participant/organizers');
      setOrganizers(res.data.organizers || []);
    } catch (error) {
      toast.error('Error loading organizers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (organizerId, isFollowing) => {
    try {
      if (isFollowing) {
        await axios.post(`/api/participant/organizers/${organizerId}/unfollow`);
        toast.success('Unfollowed organizer');
      } else {
        await axios.post(`/api/participant/organizers/${organizerId}/follow`);
        toast.success('Following organizer');
      }
      fetchOrganizers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating follow status');
    }
  };

  const categories = ['all', ...new Set(organizers.map((o) => o.category).filter(Boolean))];

  const filteredOrganizers = organizers.filter((org) => {
    const name = org.organizerName || '';
    const category = org.category || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
    const matchesFollowed = !followedOnly || org.isFollowing;
    return matchesSearch && matchesCategory && matchesFollowed;
  });

  if (loading) return <div className="loading">Loading organizers...</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Event Organizers</h1>

      
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Search organizers by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />

        </div>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}>

              {categories.map((cat) =>
              <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              )}
            </select>
          </div>

          <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={followedOnly}
                onChange={(e) => setFollowedOnly(e.target.checked)} />

              Show Followed Only
            </label>
          </div>
        </div>
      </div>

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div className="stat-card">
          <h3>{organizers.length}</h3>
          <p>Total Organizers</p>
        </div>
        <div className="stat-card">
          <h3>{organizers.filter((o) => o.isFollowing).length}</h3>
          <p>Following</p>
        </div>
        <div className="stat-card">
          <h3>{categories.length - 1}</h3>
          <p>Categories</p>
        </div>
      </div>

      
      <h2 style={{ marginBottom: '15px' }}>
        {filteredOrganizers.length} Organizer{filteredOrganizers.length !== 1 ? 's' : ''}
      </h2>

      {filteredOrganizers.length > 0 ?
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredOrganizers.map((organizer) =>
        <div
          key={organizer._id}
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/organizers/${organizer._id}`)}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{organizer.organizerName}</h3>
                  <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: '#e7f3ff',
                color: '#004085'
              }}>
                    {organizer.category}
                  </span>
                </div>
                <button
              className={`btn ${organizer.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '8px 16px', fontSize: '14px' }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFollow(organizer._id, organizer.isFollowing);
              }}>

                  {organizer.isFollowing ? '✓ Following' : '+ Follow'}
                </button>
              </div>

              <div style={{ fontSize: '14px', marginBottom: '15px' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Contact:</strong> {organizer.contactEmail || '—'}
                </p>
                {organizer.description &&
            <p style={{ margin: '10px 0 0 0', color: '#495057', lineHeight: '1.5' }}>
                    {organizer.description}
                  </p>
            }
              </div>

              <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/organizers/${organizer._id}`);
            }}
            style={{ marginTop: '10px' }}>

                View Organizer
              </button>
            </div>
        )}
        </div> :

      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Organizers Found</h3>
          <p style={{ color: '#6c757d' }}>
            {searchTerm || categoryFilter !== 'all' || followedOnly ?
          'Try adjusting your search or filters' :
          'No organizers available'}
          </p>
        </div>
      }
    </div>);

}

export default Organizers;
