const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Timetable = require('../models/Timetable');

// @route   POST api/timetable/add
// @desc    Add class slot
// @access  Private
router.post('/add', auth, async (req, res) => {
    const { day, startTime, endTime, subject, location } = req.body;

    try {
        const newSlot = new Timetable({
            userId: req.user.id,
            day,
            startTime,
            endTime,
            subject,
            location
        });

        const slot = await newSlot.save();
        res.json(slot);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/timetable/my
// @desc    Get current user's timetable (for specific day or all)
// @access  Private
router.get('/my', auth, async (req, res) => {
    try {
        const profile = await require('../models/Profile').findOne({ userId: req.user.id });
        if (!profile) return res.status(400).json({ msg: 'Profile not found' });

        const query = {
            batch: profile.batch,
            subBatch: profile.subBatch
        };

        if (req.query.day) {
            query.day = req.query.day;
        }

        const timetable = await Timetable.find(query).sort({ startTime: 1 });
        res.json(timetable);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/timetable/free-slots
// @desc    Calculate free slots for a specific day
// @access  Private
router.get('/free-slots', auth, async (req, res) => {
    const day = req.query.day || 'MON'; // Default to MON

    try {
        const profile = await require('../models/Profile').findOne({ userId: req.user.id });
        if (!profile) return res.status(400).json({ msg: 'Profile not found' });

        const timetable = await Timetable.find({
            batch: profile.batch,
            subBatch: profile.subBatch,
            day
        }).sort({ startTime: 1 });

        const freeSlots = [];
        let collegeStart = "09:00";
        const collegeEnd = "17:00";

        // Helper to convert time string "HH:MM" to minutes
        const toMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Helper to convert minutes to time string "HH:MM"
        const toTimeStr = (minutes) => {
            const h = Math.floor(minutes / 60).toString().padStart(2, '0');
            const m = (minutes % 60).toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        let lastEndTime = toMinutes(collegeStart);

        timetable.forEach(slot => {
            // if (slot.isCancelled) return; // Feature not implemented yet

            const slotStart = toMinutes(slot.startTime);
            const slotEnd = toMinutes(slot.endTime);

            if (slotStart > lastEndTime) {
                // Found a gap
                freeSlots.push({
                    startTime: toTimeStr(lastEndTime),
                    endTime: toTimeStr(slotStart),
                    duration: slotStart - lastEndTime,
                    start: toTimeStr(lastEndTime), // Standardize for frontend
                    end: toTimeStr(slotStart)
                });
            }

            lastEndTime = Math.max(lastEndTime, slotEnd);
        });

        // Check gap after last class until college end
        const collegeEndMins = toMinutes(collegeEnd);
        if (lastEndTime < collegeEndMins) {
            freeSlots.push({
                startTime: toTimeStr(lastEndTime),
                endTime: collegeEnd,
                duration: collegeEndMins - lastEndTime,
                start: toTimeStr(lastEndTime),
                end: collegeEnd
            });
        }

        res.json({ day, freeSlots });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
