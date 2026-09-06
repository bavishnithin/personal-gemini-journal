import express from 'express';
import { db } from '../firebaseAdmin.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const entriesRef = db.collection('users').doc(req.user.uid).collection('entries');
    const snapshot = await entriesRef.orderBy('createdAt', 'asc').get();
    
    const entries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        summary: data.summary,
        mood: data.mood,
        tags: data.tags,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
      };
    });
    
    res.json({
      entries,
      exportedAt: new Date().toISOString(),
      entryCount: entries.length
    });
  } catch (error) {
    console.error('Error exporting entries');
    res.status(500).json({ error: 'Failed to export entries' });
  }
});

export default router;
