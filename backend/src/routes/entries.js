import express from 'express';
import { admin, db } from '../firebaseAdmin.js';
import { generateContent } from '../services/gemini.js';

const router = express.Router();

// GET all entries
router.get('/', async (req, res) => {
  try {
    const entriesRef = db.collection('users').doc(req.user.uid).collection('entries');
    const snapshot = await entriesRef.orderBy('createdAt', 'desc').get();
    
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ entries });
  } catch (error) {
    console.error('Error fetching entries');
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST new entry
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (typeof text !== 'string' || text.trim() === '' || text.length > 50000) {
      return res.status(400).json({ error: 'Text must be a non-empty string up to 50000 characters' });
    }

    const summary = text.length > 200 ? text.substring(0, 197) + '...' : text;
    
    const entryData = {
      text,
      summary,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const entriesRef = db.collection('users').doc(req.user.uid).collection('entries');
    const docRef = await entriesRef.add(entryData);
    
    res.status(201).json({ 
      id: docRef.id, 
      text: entryData.text, 
      summary: entryData.summary,
      // Cannot return serverTimestamp directly to client, return ISO string estimate for now
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating entry');
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// GET single entry
router.get('/:id', async (req, res) => {
  try {
    const docRef = db.collection('users').doc(req.user.uid).collection('entries').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ entry: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error fetching entry');
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// DELETE single entry
router.delete('/:id', async (req, res) => {
  try {
    const docRef = db.collection('users').doc(req.user.uid).collection('entries').doc(req.params.id);
    // Delete operation succeeds even if doc doesn't exist
    await docRef.delete();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry');
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// POST /:id/analyze (Trends Feature A)
router.post('/:id/analyze', async (req, res) => {
  try {
    const docRef = db.collection('users').doc(req.user.uid).collection('entries').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    const entryData = doc.data();
    const entryText = entryData.text;
    const truncatedText = entryText.length > 2000 ? entryText.substring(0, 2000) : entryText;
    
    const prompt = `Analyze the following journal entry. Return a JSON object with exactly two fields: "mood" (a single word like happy, sad, anxious, grateful, reflective, excited, calm, frustrated, hopeful, neutral) and "tags" (an array of 1-3 short topic keywords). Return ONLY the JSON, no markdown formatting.\n\nEntry: ${truncatedText}`;
    
    const result = await generateContent(prompt);
    let rawResponse = result.text.trim();
    
    // Strip markdown formatting if present
    if (rawResponse.startsWith('```json')) {
      rawResponse = rawResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (rawResponse.startsWith('```')) {
      rawResponse = rawResponse.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const parsed = JSON.parse(rawResponse);
    const mood = parsed.mood || 'neutral';
    const tags = parsed.tags || [];
    
    await docRef.update({
      mood,
      tags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ mood, tags });
  } catch (error) {
    console.error('Error analyzing entry:', error.message);
    if (error.message && error.message.includes('Failed to retrieve secrets')) {
      return res.status(503).json({ error: 'Service Unavailable' });
    }
    res.status(500).json({ error: 'Failed to analyze entry' });
  }
});

export default router;
