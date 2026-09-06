import express from 'express';
import { admin, db } from '../firebaseAdmin.js';
import { generateContent } from '../services/gemini.js';

const router = express.Router();

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const promptsRef = db.collection('users').doc(req.user.uid).collection('dailyPrompts').doc(today);
    const cachedDoc = await promptsRef.get();
    
    if (cachedDoc.exists) {
      return res.json({ prompt: cachedDoc.data().prompt, date: today });
    }
    
    const entriesRef = db.collection('users').doc(req.user.uid).collection('entries');
    const snapshot = await entriesRef.orderBy('createdAt', 'desc').limit(5).get();
    
    let generatedPrompt = '';
    
    if (snapshot.empty) {
      generatedPrompt = "What inspired you to start a journal, and what are you hoping to discover about yourself through writing?";
    } else {
      const summaries = snapshot.docs.map(doc => doc.data().summary || doc.data().text.substring(0, 100)).join('\n- ');
      
      const aiPrompt = `Based on these recent journal entries, generate a single thoughtful, personalized journaling prompt for today. The prompt should encourage deeper self-reflection and be specific to themes from the entries. Do not repeat the entries back. Return only the prompt text.\n\nRecent entries:\n- ${summaries}`;
      
      const result = await generateContent(aiPrompt);
      generatedPrompt = result.text.trim();
    }
    
    await promptsRef.set({
      prompt: generatedPrompt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ prompt: generatedPrompt, date: today });
  } catch (error) {
    console.error('Error generating prompt:', error.message);
    if (error.message && error.message.includes('Failed to retrieve secrets')) {
      return res.status(503).json({ error: 'Service Unavailable' });
    }
    res.status(500).json({ error: 'Failed to generate prompt' });
  }
});

export default router;
