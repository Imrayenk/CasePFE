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

// POST /api/ai/evidence
router.post('/evidence', async (req, res) => {
    try {
        const { caseContent } = req.body;

        if (!caseContent) {
            return res.status(400).json({ error: 'caseContent is required.' });
        }

        const provider = getAiProvider();
        const evidence = await provider.extractEvidence(caseContent);

        res.json({ evidence });
    } catch (error) {
        console.error('Error in /api/ai/evidence:', error);
        res.status(500).json({ error: 'Failed to extract evidence: ' + error.message });
    }
});

// POST /api/ai/final-submission
router.post('/final-submission', async (req, res) => {
    try {
        const { caseContent, guidedDraft, mapSummary } = req.body;

        if (!caseContent) {
            return res.status(400).json({ error: 'caseContent is required.' });
        }

        const provider = getAiProvider();
        const finalSubmission = await provider.draftFinalSubmission({
            caseContent,
            guidedDraft: guidedDraft || {},
            mapSummary: mapSummary || ''
        });

        res.json({ finalSubmission });
    } catch (error) {
        console.error('Error in /api/ai/final-submission:', error);
        res.status(500).json({ error: 'Failed to draft final submission: ' + error.message });
    }
});

module.exports = router;
