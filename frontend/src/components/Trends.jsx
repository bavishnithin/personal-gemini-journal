import React, { useEffect, useState } from 'react';
import { apiGet } from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function Trends() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/trends')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner"></div>;
  if (!data) return <div className="container">Failed to load trends.</div>;

  const moodMap = { happy: 5, excited: 5, grateful: 4, hopeful: 4, calm: 3, reflective: 3, neutral: 2, anxious: 1, frustrated: 1, sad: 0 };
  
  const moodData = (data.moods || []).map(m => ({
    date: new Date(m.date).toLocaleDateString(),
    moodValue: moodMap[m.mood?.toLowerCase()] ?? 2,
    mood: m.mood
  })).reverse();

  const tagData = (data.tags || []).map(t => ({
    name: t.tag,
    count: t.count
  }));

  return (
    <div className="container">
      <h2>Your Trends</h2>
      
      <div className="card">
        <h3>Mood over Time</h3>
        {moodData.length < 2 ? (
          <p>Not enough mood data yet.</p>
        ) : (
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#a0a0b0" />
                <YAxis domain={[0, 5]} ticks={[0,1,2,3,4,5]} stroke="#a0a0b0" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#16213e', border: 'none', color: '#fff' }} />
                <Line type="monotone" dataKey="moodValue" stroke="#e94560" strokeWidth={3} activeDot={{ r: 8 }} name="Mood Level" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Top Topics</h3>
        {tagData.length === 0 ? (
          <p>No topics extracted yet.</p>
        ) : (
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={tagData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#a0a0b0" />
                <YAxis allowDecimals={false} stroke="#a0a0b0" />
                <RechartsTooltip contentStyle={{ backgroundColor: '#16213e', border: 'none', color: '#fff' }} />
                <Bar dataKey="count" fill="#4CAF50" name="Occurrences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
