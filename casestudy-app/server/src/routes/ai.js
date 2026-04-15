const express = require('express');
const router = express.Router();
const { getAiProvider } = require('../services/ai');

// POST /api/ai/draft
router.post('/draft', async (req, res) => {
    try {
        const { caseContent, keywords, logicalMapString } = req.body;
        
        if (!caseContent) {
            return res.status(400).json({ error: 'caseContent is required.' });
        }

        const provider = getAiProvider();
        const draftHtml = await provider.generateDraft({
            caseContent,
            keywords: keywords || [],
            logicalMapString: logicalMapString || ''
        });

        res.json({ draftHtml });
    } catch (error) {
        console.error('Error in /api/ai/draft:', error);
        res.status(500).json({ error: 'Failed to generate draft: ' + error.message });
    }
});

// POST /api/ai/concepts
router.post('/concepts', async (req, res) => {
    try {
        const { caseContent } = req.body;

        if (!caseContent) {
            return res.status(400).json({ error: 'caseContent is required.' });
        }

        const provider = getAiProvider();
        const concepts = await provider.extractConcepts(caseContent);

        res.json({ concepts });
    } catch (error) {
        console.error('Error in /api/ai/concepts:', error);
        res.status(500).json({ error: 'Failed to extract concepts: ' + error.message });
    }
});

module.exports = router;
