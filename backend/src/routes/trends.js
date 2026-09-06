import express from 'express';
import { db } from '../firebaseAdmin.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const entriesRef = db.collection('users').doc(req.user.uid).collection('entries');
    const snapshot = await entriesRef.get();
    
    const moods = [];
    const tagsMap = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.mood && data.tags) {
        let dateStr = 'unknown';
        if (data.createdAt && data.createdAt.toDate) {
          dateStr = data.createdAt.toDate().toISOString();
        }
        moods.push({
          date: dateStr,
          mood: data.mood
        });
        
        data.tags.forEach(tag => {
          tagsMap[tag] = (tagsMap[tag] || 0) + 1;
        });
      }
    });
    
    // Convert date string if needed, sort logic can be done on client side
    res.json({ moods, tags: tagsMap });
  } catch (error) {
    console.error('Error fetching trends');
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

export default router;
