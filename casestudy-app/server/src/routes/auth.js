const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'learner'
            }
        });

        // Generate token
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url } });
    } catch (error) {
        console.error("Auth Route Error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url } });
    } catch (error) {
        console.error("Auth Route Error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url } });
    } catch (error) {
        console.error("Auth Route Error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

module.exports = router;
