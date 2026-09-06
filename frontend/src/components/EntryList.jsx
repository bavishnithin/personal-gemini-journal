import React, { useEffect, useState } from 'react';
import { apiGet, apiDelete } from '../services/api';

export default function EntryList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEntries = async () => {
    try {
      const data = await apiGet('/api/entries');
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await apiDelete(`/api/entries/${id}`);
      setEntries(entries.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (error) return <div className="container" style={{color: 'red'}}>{error}</div>;

  return (
    <div className="container">
      <h2>Journal Entries</h2>
      {entries.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        entries.map(entry => (
          <div key={entry.id} className="card">
            <div className="card-header">
              <strong>{new Date(entry.createdAt).toLocaleString()}</strong>
              <button className="danger" onClick={() => handleDelete(entry.id)}>Delete</button>
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{entry.summary}</p>
            {(entry.mood || entry.tags) && (
              <div style={{ marginTop: '15px' }}>
                {entry.mood && (
                  <span className={`badge mood-${entry.mood.toLowerCase()}`}>
                    Mood: {entry.mood}
                  </span>
                )}
                {entry.tags?.map(tag => (
                  <span key={tag} className="badge">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
