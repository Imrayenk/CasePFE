const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/users
router.get('/', authMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar_url: true,
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/users/:id/avatar
router.put('/:id/avatar', authMiddleware, async (req, res) => {
    try {
        const { avatar_url } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { avatar_url }
        });
        res.json({ id: user.id, avatar_url: user.avatar_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/users/:id/name
router.put('/:id/name', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { name }
        });
        res.json({ id: user.id, name: user.name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/users/:id/role
router.put('/:id/role', authMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { role }
        });
        res.json({ id: user.id, role: user.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
