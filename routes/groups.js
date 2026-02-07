const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const Profile = require('../models/Profile');

// @route   POST api/groups/create
// @desc    Create a new group activity
// @access  Private
router.post('/create', auth, async (req, res) => {
    const { interestTag, duration } = req.body;

    try {
        // Check if group already exists for this interest
        let group = await Group.findOne({ interestTag, isActive: true });
        if (group) {
            return res.status(400).json({ msg: `A group for ${interestTag} already exists.` });
        }

        // Calculate expiry
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + parseInt(duration));

        const newGroup = new Group({
            creatorId: req.user.id,
            interestTag,
            durationMinutes: duration,
            expiryTime,
            members: [req.user.id] // Creator joins immediately
        });

        const savedGroup = await newGroup.save();
        res.json(savedGroup);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/groups/join/:id
// @desc    Join an existing group
// @access  Private
router.post('/join/:id', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group || !group.isActive) {
            return res.status(404).json({ msg: 'Group not found or inactive' });
        }

        if (group.members.includes(req.user.id)) {
            return res.status(400).json({ msg: 'Already a member' });
        }

        group.members.push(req.user.id);
        await group.save();

        res.json(group);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/groups/active
// @desc    Get all active groups
// @access  Private
router.get('/active', auth, async (req, res) => {
    try {
        const groups = await Group.find({ isActive: true })
            .populate('creatorId', 'name')
            .sort({ startTime: -1 });
        res.json(groups);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
