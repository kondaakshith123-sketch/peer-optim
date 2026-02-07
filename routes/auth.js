const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Domain validation
        if (!email.endsWith('@iiitkota.ac.in')) {
            return res.status(400).json({ msg: 'Only @iiitkota.ac.in emails are allowed' });
        }

        // Extract studentId
        const studentId = email.split('@')[0];

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            studentId,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Automatic Batch Mapping Logic
        let branchType = 'Other';
        if (studentId.includes('kucp')) branchType = 'CSE';
        else if (studentId.includes('kuec')) branchType = 'ECE';
        else if (studentId.includes('kuad')) branchType = 'AI';

        const rollMatch = studentId.match(/(\d+)$/);
        const rollNum = rollMatch ? parseInt(rollMatch[1]) % 1000 : 1;

        // Year Mapping: 2025 -> 1st, 2024 -> 2nd, 2023 -> 3rd, 2022 -> 4th
        const idYear = studentId.substring(0, 4);
        let yearLabel = 'Unknown';
        if (idYear === '2025') yearLabel = '1st';
        else if (idYear === '2024') yearLabel = '2nd';
        else if (idYear === '2023') yearLabel = '3rd';
        else if (idYear === '2022') yearLabel = '4th';

        let batch, subBatch;
        if (branchType === 'CSE' || branchType === 'AI') { // Grouping AI with CSE batches for now or treating separately
            if (rollNum <= 30) { batch = 'A'; subBatch = 'A1'; }
            else if (rollNum <= 60) { batch = 'A'; subBatch = 'A2'; }
            else if (rollNum <= 90) { batch = 'A'; subBatch = 'A3'; }
            else if (rollNum <= 120) { batch = 'B'; subBatch = 'B1'; }
            else if (rollNum <= 150) { batch = 'B'; subBatch = 'B2'; }
            else { batch = 'B'; subBatch = 'B3'; }
        } else if (branchType === 'ECE') {
            if (rollNum <= 30) { batch = 'C'; subBatch = 'C1'; }
            else if (rollNum <= 60) { batch = 'C'; subBatch = 'C2'; }
            else if (rollNum <= 90) { batch = 'C'; subBatch = 'C3'; }
            else if (rollNum <= 120) { batch = 'D'; subBatch = 'D1'; }
            else if (rollNum <= 150) { batch = 'D'; subBatch = 'D2'; }
            else { batch = 'D'; subBatch = 'D3'; }
        }

        // Create initial profile with automated details
        const profile = new Profile({
            userId: user.id,
            fullName: name,
            rollNo: studentId.toUpperCase(),
            branch: branchType,
            batch: batch,
            subBatch: subBatch,
            year: yearLabel
        });
        await profile.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, batch, subBatch });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
