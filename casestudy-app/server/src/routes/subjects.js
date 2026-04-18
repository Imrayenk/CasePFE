const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = authMiddleware;
const crypto = require('crypto');

// Generate unique enrollment password
async function generateUniquePassword() {
  let isUnique = false;
  let password = '';
  while (!isUnique) {
    password = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 char string
    const existing = await prisma.subject.findUnique({ where: { enrollmentPassword: password } });
    if (!existing) {
      isUnique = true;
    }
  }
  return password;
}

// GET /api/subjects
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        let subjects = [];

        if (user.role === 'teacher' || user.role === 'admin') {
            subjects = await prisma.subject.findMany({
                where: { teacherId: user.id },
                include: {
                    enrolledStudents: {
                        select: { id: true, name: true, email: true, role: true }
                    },
                    cases: true
                },
                orderBy: { createdAt: 'desc' }
            });
        } else if (user.role === 'learner') {
            subjects = await prisma.subject.findMany({
                where: {
                    enrolledStudents: {
                        some: { id: user.id }
                    }
                },
                include: {
                    cases: {
                        where: { status: 'active' } // Learners only see active cases
                    },
                    teacher: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        res.json(subjects);
    } catch (error) {
        console.error("GET /subjects error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

// POST /api/subjects (Create Subject)
router.post('/', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Subject name is required' });
        }

        const password = await generateUniquePassword();

        const newSubject = await prisma.subject.create({
            data: {
                name,
                description,
                enrollmentPassword: password,
                teacherId: req.user.id
            },
            include: {
                enrolledStudents: true,
                cases: true
            }
        });
        res.json(newSubject);
    } catch (error) {
        console.error("POST /subjects error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

// POST /api/subjects/enroll (Learner Enrollment)
router.post('/enroll', authMiddleware, requireRole(['learner']), async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Enrollment password is required' });
        }

        const subject = await prisma.subject.findUnique({
            where: { enrollmentPassword: password.trim() },
            include: {
                enrolledStudents: {
                    select: { id: true }
                }
            }
        });

        if (!subject) {
            return res.status(404).json({ error: 'Invalid enrollment password' });
        }

        // Check if already enrolled
        const isEnrolled = subject.enrolledStudents.some(s => s.id === req.user.id);
        if (isEnrolled) {
            return res.status(400).json({ error: 'You are already enrolled in this subject' });
        }

        const updatedSubject = await prisma.subject.update({
            where: { id: subject.id },
            data: {
                enrolledStudents: {
                    connect: { id: req.user.id }
                }
            },
            include: {
                cases: {
                    where: { status: 'active' }
                },
                teacher: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json({ message: 'Successfully enrolled', subject: updatedSubject });
    } catch (error) {
        console.error("POST /subjects/enroll error:", error);
        res.status(500).json({ error: error.message || 'Unknown server error' });
    }
});

module.exports = router;
