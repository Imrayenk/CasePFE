const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/notifications/:userId
router.get('/:userId', async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.params.userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/notifications
router.post('/', async (req, res) => {
    try {
        const { userId, title, message } = req.body;
        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                read: false
            }
        });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/notifications/:userId/read
router.put('/:userId/read', async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { 
                userId: req.params.userId,
                read: false 
            },
            data: { read: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/notifications/:userId
router.delete('/:userId', async (req, res) => {
    try {
        await prisma.notification.deleteMany({
            where: { userId: req.params.userId }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
