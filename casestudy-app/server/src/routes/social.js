const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/cases/:id/comments
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await prisma.comment.findMany({
            where: { caseId: req.params.id },
            include: { user: { select: { name: true, avatar_url: true } } },
            orderBy: { createdAt: 'asc' }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/cases/:id/likes
router.get('/:id/likes', async (req, res) => {
    try {
        const likes = await prisma.like.findMany({
            where: { caseId: req.params.id },
            select: { userId: true }
        });
        res.json(likes.map(l => l.userId));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/cases/social/all (Alternative bulk endpoint as the frontend uses one fetch for all)
router.get('/social/all', async (req, res) => {
    try {
        const [likesData, commentsData] = await Promise.all([
            prisma.like.findMany({}),
            prisma.comment.findMany({ include: { user: { select: { name: true, avatar_url: true } } } })
        ]);
        res.json({ likes: likesData, comments: commentsData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/cases/:id/comments
router.post('/:id/comments', async (req, res) => {
    try {
        const { userId, text } = req.body;
        const caseId = req.params.id;
        const comment = await prisma.comment.create({
            data: {
                text,
                userId,
                caseId
            },
            include: { user: { select: { name: true, avatar_url: true } } }
        });
        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/cases/:id/comments/:commentId
router.delete('/:id/comments/:commentId', async (req, res) => {
    try {
        await prisma.comment.delete({
            where: { id: req.params.commentId }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/cases/:id/likes
router.post('/:id/likes', async (req, res) => {
    try {
        const { userId } = req.body;
        const caseId = req.params.id;

        // Toggle logic: check if exists
        const existing = await prisma.like.findFirst({
            where: { caseId, userId }
        });

        if (existing) {
            await prisma.like.delete({
                where: { id: existing.id }
            });
            res.json({ status: 'removed' });
        } else {
            const like = await prisma.like.create({
                data: { caseId, userId }
            });
            res.json({ status: 'added', like });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
