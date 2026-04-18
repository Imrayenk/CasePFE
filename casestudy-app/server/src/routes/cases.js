const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = authMiddleware;
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    try {
        let userId = null;
        let role = null;
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_dev_secret');
                userId = decoded.id;
                role = decoded.role;
            } catch (e) {}
        }

        let cases;

        if (role === 'teacher') {
            cases = await prisma.case.findMany({
                where: { teacherId: userId },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // For learners or public homepage (PopularCases), return only active cases
            cases = await prisma.case.findMany({
                where: { 
                    status: { in: ['Active', 'active'] }
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        
        res.json(cases);
    } catch (error) {
        console.error("GET / cases error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

// GET /api/cases/:id
router.get('/:id', async (req, res) => {
    try {
        const c = await prisma.case.findUnique({
            where: { id: req.params.id }
        });
        if (!c) return res.status(404).json({ error: 'Case not found' });
        res.json(c);
    } catch (error) {
        console.error("GET /:id cases error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

// POST /api/cases
router.post('/', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        const { title, content, description, status, attachments, update_history, subjectId, required_steps, custom_steps } = req.body;
        if (!subjectId) {
            return res.status(400).json({ error: 'subjectId is required to create a case' });
        }
        const newCase = await prisma.case.create({
            data: {
                title,
                content,
                description,
                status: status || 'draft',
                attachments: attachments ? JSON.stringify(attachments) : null,
                update_history: update_history ? JSON.stringify(update_history) : null,
                required_steps: required_steps ? JSON.stringify(required_steps) : null,
                custom_steps: custom_steps ? JSON.stringify(custom_steps) : null,
                teacherId: req.user.id,
                subjectId
            }
        });
        res.json(newCase);
    } catch (error) {
        console.error("POST / cases error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

// PUT /api/cases/:id
router.put('/:id', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        const { title, content, description, status, attachments, update_history, subjectId, required_steps, custom_steps } = req.body;
        const dataToUpdate = {
            title,
            content,
            description,
            status,
            attachments: attachments ? JSON.stringify(attachments) : null,
            update_history: update_history ? JSON.stringify(update_history) : null,
            required_steps: required_steps ? JSON.stringify(required_steps) : null,
            custom_steps: custom_steps ? JSON.stringify(custom_steps) : null,
        };
        if (subjectId) dataToUpdate.subjectId = subjectId;

        const updated = await prisma.case.update({
            where: { id: req.params.id },
            data: dataToUpdate
        });
        res.json(updated);
    } catch (error) {
        console.error("PUT /:id cases error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

// DELETE /api/cases/:id
router.delete('/:id', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        const caseId = req.params.id;

        await prisma.$transaction(async (tx) => {
            const submissions = await tx.submission.findMany({
                where: { caseId },
                select: { id: true }
            });
            const subIds = submissions.map(s => s.id);

            if (subIds.length > 0) {
                await tx.conceptNode.deleteMany({ where: { submissionId: { in: subIds } } });
                await tx.submissionKeyword.deleteMany({ where: { submissionId: { in: subIds } } });
                await tx.submission.deleteMany({ where: { caseId } });
            }

            await tx.comment.deleteMany({ where: { caseId } });
            await tx.like.deleteMany({ where: { caseId } });
            
            await tx.case.delete({ where: { id: caseId } });
        });

        res.json({ success: true });
    } catch (error) {
        console.error("DELETE /:id cases error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

module.exports = router;
