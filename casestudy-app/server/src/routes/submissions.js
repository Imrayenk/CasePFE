const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = authMiddleware;

function parseJsonArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function normalizeText(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeList(value) {
    if (Array.isArray(value)) {
        return value.map(item => normalizeText(item)).filter(Boolean);
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.map(item => normalizeText(typeof item === 'string' ? item : item?.text)).filter(Boolean);
            }
        } catch {
            // Plain strings are accepted below.
        }
        return value.trim() ? [value.trim()] : [];
    }
    return [];
}

function stripHtml(html = '') {
    return html
        .replace(/<p>|<br\s*\/?>|<li>|<ol>|<ul>|<div>|<h1>|<h2>|<h3>/gi, ' ')
        .replace(/<\/p>|<\/li>|<\/ol>|<\/ul>|<\/div>|<\/h1>|<\/h2>|<\/h3>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/ig, ' ')
        .replace(/&[a-z]+;/ig, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function countWords(html = '') {
    const plainText = stripHtml(html);
    return plainText ? plainText.split(/\s+/).length : 0;
}

function getGuidedDraftFromBody(body, existing = null) {
    const source = body.guidedDraft || body;
    const existingGuided = existing ? getGuidedDraftFromSubmission(existing) : {};
    const fallbackFinal = body.summary_text || existing?.summary_text || '';

    const draft = {
        main_problem: normalizeText(source.main_problem ?? source.guided_main_problem ?? existingGuided.main_problem),
        evidence: normalizeList(source.evidence ?? source.guided_evidence ?? existingGuided.evidence),
        root_causes: normalizeList(source.root_causes ?? source.guided_root_causes ?? existingGuided.root_causes),
        possible_solutions: normalizeList(source.possible_solutions ?? source.guided_possible_solutions ?? existingGuided.possible_solutions),
        recommendation: normalizeText(source.recommendation ?? source.guided_recommendation ?? existingGuided.recommendation),
        justification: normalizeText(source.justification ?? source.guided_justification ?? existingGuided.justification),
        final_submission: normalizeText(source.final_submission ?? source.guided_final_submission ?? existingGuided.final_submission ?? fallbackFinal),
    };

    for (const key in existingGuided) {
        if (key.startsWith('custom_')) {
            draft[key] = existingGuided[key];
        }
    }
    for (const key in source) {
        if (key.startsWith('custom_')) {
            if (Array.isArray(source[key])) {
                draft[key] = normalizeList(source[key]);
            } else {
                draft[key] = normalizeText(source[key]);
            }
        }
    }

    return draft;
}

function getGuidedDraftFromSubmission(submission) {
    let customStepsData = {};
    if (submission.guided_custom_steps) {
        try {
            customStepsData = JSON.parse(submission.guided_custom_steps);
        } catch { }
    }
    return {
        main_problem: submission.guided_main_problem || '',
        evidence: parseJsonArray(submission.guided_evidence),
        root_causes: parseJsonArray(submission.guided_root_causes),
        possible_solutions: parseJsonArray(submission.guided_possible_solutions),
        recommendation: submission.guided_recommendation || '',
        justification: submission.guided_justification || '',
        final_submission: submission.guided_final_submission || submission.summary_text || '',
        ...customStepsData
    };
}

function getMapNodes(body, existing = null) {
    if (body.draft_nodes !== undefined) {
        return parseJsonArray(body.draft_nodes);
    }
    return existing ? parseJsonArray(existing.draft_nodes) : [];
}

function getMapEdges(body, existing = null) {
    if (body.draft_edges !== undefined) {
        return parseJsonArray(body.draft_edges);
    }
    return existing ? parseJsonArray(existing.draft_edges) : [];
}

function serializeDraftFields(guidedDraft, nodes, edges, status, currentStep) {
    const customStepsData = {};
    for (const key in guidedDraft) {
        if (key.startsWith('custom_')) {
            customStepsData[key] = guidedDraft[key];
        }
    }

    return {
        status,
        summary_text: guidedDraft.final_submission || null,
        guided_main_problem: guidedDraft.main_problem || null,
        guided_evidence: JSON.stringify(guidedDraft.evidence || []),
        guided_root_causes: JSON.stringify(guidedDraft.root_causes || []),
        guided_possible_solutions: JSON.stringify(guidedDraft.possible_solutions || []),
        guided_recommendation: guidedDraft.recommendation || null,
        guided_justification: guidedDraft.justification || null,
        guided_final_submission: guidedDraft.final_submission || null,
        guided_custom_steps: JSON.stringify(customStepsData),
        current_step: Number.isInteger(currentStep) ? currentStep : 0,
        draft_nodes: JSON.stringify(nodes || []),
        draft_edges: JSON.stringify(edges || []),
        word_count: countWords(guidedDraft.final_submission),
        keyword_count: Array.isArray(guidedDraft.evidence) ? guidedDraft.evidence.length : 0,
        node_count: Array.isArray(nodes) ? nodes.length : 0,
        has_conclusion: Array.isArray(nodes) && nodes.some(node => node.type === 'conclusionNode'),
    };
}

function validateGuidedSubmission(guidedDraft, nodes, requiredSteps, customSteps) {
    const errors = [];
    const isRequired = (key) => !requiredSteps || requiredSteps.includes(key);

    if (isRequired('main_problem') && !guidedDraft.main_problem) errors.push('Main Problem is required.');
    if (isRequired('evidence') && !guidedDraft.evidence?.length) errors.push('At least one Evidence item is required.');
    if (isRequired('root_causes') && !guidedDraft.root_causes?.length) errors.push('At least one Root Cause is required.');
    if (isRequired('possible_solutions') && !guidedDraft.possible_solutions?.length) errors.push('At least one Possible Solution is required.');
    if (isRequired('recommendation') && !guidedDraft.recommendation) errors.push('Recommendation is required.');
    if (isRequired('justification') && !guidedDraft.justification) errors.push('Justification is required.');
    if (!guidedDraft.final_submission) errors.push('Final Submission is required.');

    (customSteps || []).forEach(step => {
        const val = guidedDraft[step.key];
        if (step.type === 'list') {
            if (!val || !val.length) errors.push(`${step.title} is required.`);
        } else {
            if (!val || typeof val !== 'string' || !val.trim()) errors.push(`${step.title} is required.`);
        }
    });

    const nodeTypes = new Set((nodes || []).map(node => node.type));
    const requiredMapTypes = [
        ['problemNode', 'Main Problem map node is required.', 'main_problem'],
        ['evidenceNode', 'Evidence map node is required.', 'evidence'],
        ['causeNode', 'Root Cause map node is required.', 'root_causes'],
        ['solutionNode', 'Possible Solution map node is required.', 'possible_solutions'],
        ['conclusionNode', 'Recommendation map node is required.', 'recommendation'],
    ];
    
    requiredMapTypes.forEach(([type, message, stepKey]) => {
        if (isRequired(stepKey) && !nodeTypes.has(type)) {
             errors.push(message);
        }
    });

    return errors;
}

function formatSubmissionDetails(submission) {
    return {
        id: submission.id,
        status: submission.status,
        final_grade: submission.final_grade,
        teacher_feedback: submission.teacher_feedback || '',
        submittedAt: submission.submittedAt,
        current_step: submission.current_step || 0,
        summary_text: submission.summary_text || '',
        draft_nodes: parseJsonArray(submission.draft_nodes),
        draft_edges: parseJsonArray(submission.draft_edges),
        guidedDraft: getGuidedDraftFromSubmission(submission),
        override_history: parseJsonArray(submission.override_history),
    };
}

// GET /api/submissions
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { learnerId } = req.query;
        let where = {};

        if (req.user.role === 'learner') {
            where.learnerId = req.user.id;
        } else if (req.user.role === 'teacher') {
            where.case = { teacherId: req.user.id };
            if (learnerId) where.learnerId = learnerId;
        } else if (learnerId) {
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

// GET /api/submissions/details/:id
router.get('/details/:id', authMiddleware, async (req, res) => {
    try {
        const submission = await prisma.submission.findUnique({
            where: { id: req.params.id }
        });

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        if (req.user.role === 'learner' && submission.learnerId !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json(formatSubmissionDetails(submission));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/submissions/:caseId/:userId
router.get('/:caseId/:userId', authMiddleware, async (req, res) => {
    try {
        const { caseId, userId } = req.params;
        const learnerId = req.user.role === 'learner' ? req.user.id : userId;
        const submission = await prisma.submission.findFirst({
            where: { caseId, learnerId }
        });

        res.json(submission ? formatSubmissionDetails(submission) : null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/submissions (Draft / Create)
router.post('/', authMiddleware, requireRole(['learner']), async (req, res) => {
    try {
        const { case_id } = req.body;
        if (!case_id) {
            return res.status(400).json({ error: 'case_id is required.' });
        }

        const existing = await prisma.submission.findFirst({
            where: { caseId: case_id, learnerId: req.user.id }
        });

        if (existing && existing.status !== 'in_progress') {
            return res.json(formatSubmissionDetails(existing));
        }

        const guidedDraft = getGuidedDraftFromBody(req.body, existing);
        const nodes = getMapNodes(req.body, existing);
        const edges = getMapEdges(req.body, existing);
        const requestedStep = Number(req.body.current_step);
        const data = {
            ...serializeDraftFields(guidedDraft, nodes, edges, 'in_progress', requestedStep),
            caseId: case_id,
            learnerId: req.user.id
        };

        const result = existing
            ? await prisma.submission.update({ where: { id: existing.id }, data })
            : await prisma.submission.create({ data });

        res.json(formatSubmissionDetails(result));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/submissions/submit
router.post('/submit', authMiddleware, requireRole(['learner']), async (req, res) => {
    try {
        const { case_id } = req.body;
        if (!case_id) {
            return res.status(400).json({ error: 'case_id is required.' });
        }

        const existing = await prisma.submission.findFirst({
            where: { caseId: case_id, learnerId: req.user.id }
        });

        if (existing && existing.status !== 'in_progress') {
            return res.status(409).json({ error: 'This submission has already been submitted for review.' });
        }

        const caseData = await prisma.case.findUnique({ where: { id: case_id } });
        if (!caseData) {
             return res.status(404).json({ error: 'Case not found.' });
        }
        
        let requiredSteps = null;
        let customSteps = [];
        try { if (caseData.required_steps) requiredSteps = JSON.parse(caseData.required_steps); } catch (e) {}
        try { if (caseData.custom_steps) customSteps = JSON.parse(caseData.custom_steps); } catch (e) {}

        const guidedDraft = getGuidedDraftFromBody(req.body, existing);
        const nodes = getMapNodes(req.body, existing);
        const edges = getMapEdges(req.body, existing);
        const validationErrors = validateGuidedSubmission(guidedDraft, nodes, requiredSteps, customSteps);

        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join(' ') });
        }

        const data = {
            ...serializeDraftFields(guidedDraft, nodes, edges, 'submitted', 6),
            final_grade: null,
            submittedAt: new Date(),
            caseId: case_id,
            learnerId: req.user.id
        };

        const result = existing
            ? await prisma.submission.update({ where: { id: existing.id }, data })
            : await prisma.submission.create({ data });

        res.json({ result: formatSubmissionDetails(result), score: null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/submissions/:id/score
router.put('/:id/score', authMiddleware, requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        const { newScore, history, teacher_feedback } = req.body;
        const existing = await prisma.submission.findUnique({
            where: { id: req.params.id }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        if (existing.status === 'in_progress') {
            return res.status(400).json({ error: 'Submission must be submitted before it can be graded.' });
        }

        const grade = Number.parseInt(newScore, 10);
        if (Number.isNaN(grade) || grade < 0 || grade > 100) {
            return res.status(400).json({ error: 'Grade must be a number from 0 to 100.' });
        }

        const firstGrade = existing.final_grade === null || existing.final_grade === undefined || existing.status === 'submitted';
        const updated = await prisma.submission.update({
            where: { id: req.params.id },
            data: {
                final_grade: grade,
                status: firstGrade ? 'graded' : 'graded_override',
                teacher_feedback: teacher_feedback || null,
                override_history: history ? JSON.stringify(history) : existing.override_history
            }
        });
        res.json(formatSubmissionDetails(updated));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
