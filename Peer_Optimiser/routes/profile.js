const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const User = require('../models/User');

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id }).populate('userId', ['name', 'email']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/update
// @desc    Update profile
// @access  Private
router.put('/update', auth, async (req, res) => {
    const {
        fullName,
        rollNo,
        branch,
        year,
        section,
        bio,
        skills
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.userId = req.user.id;
    if (fullName) profileFields.fullName = fullName;
    if (rollNo) profileFields.rollNo = rollNo;
    if (branch) profileFields.branch = branch;
    if (year) profileFields.year = year;
    if (section) profileFields.section = section;
    if (bio) profileFields.bio = bio;
    if (skills) {
        profileFields.skills = Array.isArray(skills)
            ? skills
            : skills.split(',').map(skill => skill.trim());
    }

    try {
        let profile = await Profile.findOne({ userId: req.user.id });

        if (profile) {
            // Update
            profile = await Profile.findOneAndUpdate(
                { userId: req.user.id },
                { $set: profileFields },
                { new: true }
            );

            return res.json(profile);
        }

        // Create
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
