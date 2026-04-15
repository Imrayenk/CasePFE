const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/submissions
router.get('/', async (req, res) => {
    try {
        const { learnerId } = req.query;
        let where = {};
        if (learnerId) {
            where.learnerId = learnerId;
        }

        const submissions = await prisma.submission.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { learner: { select: { name: true } } }
        });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/submissions/:caseId/:userId
router.get('/:caseId/:userId', async (req, res) => {
    try {
        const { caseId, userId } = req.params;
        const submission = await prisma.submission.findFirst({
            where: { caseId, learnerId: userId }
        });
        res.json(submission || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/submissions (Draft / Create)
router.post('/', async (req, res) => {
    try {
        const { case_id, learner_id, summary_text, draft_nodes, draft_edges, status, word_count, keyword_count, node_count, has_conclusion } = req.body;
        
        let existing = await prisma.submission.findFirst({
            where: { caseId: case_id, learnerId: learner_id }
        });

        const data = {
            summary_text,
            draft_nodes: draft_nodes ? (typeof draft_nodes === 'string' ? draft_nodes : JSON.stringify(draft_nodes)) : null,
            draft_edges: draft_edges ? (typeof draft_edges === 'string' ? draft_edges : JSON.stringify(draft_edges)) : null,
            status,
            word_count: word_count || 0,
            keyword_count: keyword_count || 0,
            node_count: node_count || 0,
            has_conclusion: has_conclusion || false,
            caseId: case_id,
            learnerId: learner_id
        };

        let result;
        if (existing) {
            result = await prisma.submission.update({
                where: { id: existing.id },
                data
            });
        } else {
            result = await prisma.submission.create({
                data
            });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/submissions/submit
router.post('/submit', async (req, res) => {
    try {
        const { case_id, learner_id, summary_text, draft_keywords, draft_nodes, draft_edges, status, word_count, keyword_count, node_count, has_conclusion } = req.body;
        
        let existing = await prisma.submission.findFirst({
            where: { caseId: case_id, learnerId: learner_id }
        });

        const score = Math.min(100, Math.floor((keyword_count * 5) + (node_count * 3) + (has_conclusion ? 10 : 0)));

        const data = {
            summary_text,
            draft_nodes: draft_nodes ? (typeof draft_nodes === 'string' ? draft_nodes : JSON.stringify(draft_nodes)) : null,
            draft_edges: draft_edges ? (typeof draft_edges === 'string' ? draft_edges : JSON.stringify(draft_edges)) : null,
            status: status || 'submitted',
            word_count: word_count || 0,
            keyword_count: keyword_count || 0,
            node_count: node_count || 0,
            has_conclusion: has_conclusion || false,
            final_grade: score,
            caseId: case_id,
            learnerId: learner_id
        };

        let result;
        if (existing) {
            result = await prisma.submission.update({
                where: { id: existing.id },
                data
            });
        } else {
            result = await prisma.submission.create({
                data
            });
        }
        res.json({ result, score });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/submissions/:id/score
router.put('/:id/score', async (req, res) => {
    try {
        const { newScore, history } = req.body;
        const updated = await prisma.submission.update({
            where: { id: req.params.id },
            data: {
                final_grade: newScore,
                status: 'graded_override',
                override_history: history ? JSON.stringify(history) : null
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
