require('dotenv').config();
const express = require('express');
const cors = require('cors');


const casesRouter = require('./routes/cases');
const submissionsRouter = require('./routes/submissions');
const socialRouter = require('./routes/social');
const aiRouter = require('./routes/ai');
const subjectsRouter = require('./routes/subjects');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/cases', casesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/cases', socialRouter);
app.use('/api/ai', aiRouter);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/subjects', subjectsRouter);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
