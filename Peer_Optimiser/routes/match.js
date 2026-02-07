
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const Timetable = require('../models/Timetable');
const User = require('../models/User');

// Helper to convert time "HH:MM" to minutes
const toMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper to convert minutes to "HH:MM"
const toTimeStr = (minutes) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

// College Hours
const COLLEGE_START = toMinutes("09:00");
const COLLEGE_END = toMinutes("17:00");

// Calculate free slots given a list of busy slots
const calculateFreeSlots = (busySlots) => {
    const freeSlots = [];
    let lastEndTime = COLLEGE_START;

    // Sort by start time
    busySlots.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

    busySlots.forEach(slot => {
        const slotStart = toMinutes(slot.startTime);
        const slotEnd = toMinutes(slot.endTime);

        if (slotStart > lastEndTime) {
            freeSlots.push({
                start: toTimeStr(lastEndTime),
                end: toTimeStr(slotStart),
                startMins: lastEndTime,
                endMins: slotStart
            });
        }
        lastEndTime = Math.max(lastEndTime, slotEnd);
    });

    if (lastEndTime < COLLEGE_END) {
        freeSlots.push({
            start: toTimeStr(lastEndTime),
            end: toTimeStr(COLLEGE_END),
            startMins: lastEndTime,
            endMins: COLLEGE_END
        });
    }

    return freeSlots;
};

// @route   GET api/match
// @desc    Find peer matches
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        // 1. Get Current User Profile
        const userProfile = await Profile.findOne({ userId: req.user.id });
        if (!userProfile || !userProfile.batch || !userProfile.subBatch) {
            return res.status(400).json({ msg: 'User profile incomplete (batch/subBatch missing)' });
        }

        const { batch, subBatch, userId } = userProfile;
        const userInterests = userProfile.skills || [];

        // 2. Fetch User's Free Slots (Using new schema fields)
        // Find timetable entries for MY batch/subBatch
        const myBusySlots = await Timetable.find({
            batch: batch,
            subBatch: subBatch,
            day: 'MON'
        });
        const myFreeSlots = calculateFreeSlots(myBusySlots);


        // 3. Find Potential Matches (Users in differing SubBatches)
        const potentialMatches = await Profile.find({
            batch: batch,
            subBatch: { $ne: subBatch },
            userId: { $ne: userId }
        }).populate('userId', ['name', 'email']);

        const matches = [];

        // 4. Process Each Potential Match
        for (const matchProfile of potentialMatches) {


            // Interest Overlap
            const matchInterests = matchProfile.skills || [];
            const commonInterests = userInterests.filter(i => matchInterests.includes(i));

            if (commonInterests.length === 0) continue;



            // Fetch Match's Free Slots (Using new schema fields)
            const matchBusySlots = await Timetable.find({
                batch: matchProfile.batch,
                subBatch: matchProfile.subBatch,
                day: 'MON'
            });
            const matchFreeSlots = calculateFreeSlots(matchBusySlots);

            // Calculate Time Overlap
            let bestOverlap = null;

            // Iterate through all combinations of free slots
            for (const mySlot of myFreeSlots) {
                for (const theirSlot of matchFreeSlots) {
                    const startMax = Math.max(mySlot.startMins, theirSlot.startMins);
                    const endMin = Math.min(mySlot.endMins, theirSlot.endMins);

                    if (endMin > startMax) {
                        const duration = endMin - startMax;
                        if (duration >= 30) {
                            bestOverlap = {
                                start: toTimeStr(startMax),
                                end: toTimeStr(endMin),
                                duration: duration
                            };
                            break;
                        }
                    }
                }
                if (bestOverlap) break;
            }

            if (bestOverlap) {
                matches.push({
                    userId: matchProfile.userId._id,
                    name: matchProfile.userId.name,
                    batch: matchProfile.batch,
                    subBatch: matchProfile.subBatch,
                    commonInterests: commonInterests,
                    commonFreeSlot: bestOverlap
                });
            }
        }

        res.json(matches);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/match/free-now
// @desc    Get count and list of peers free right now
// @access  Private
router.get('/free-now', auth, async (req, res) => {
    try {
        const day = req.query.day || 'MON'; // Default to MON

        // 1. Get Current Time
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        // 2. Fetch all unique batch/subBatch combinations that are BUSY right now
        // Find timetables for today where current time falls within start/end
        const busySlots = await Timetable.find({ day });

        const busySubBatches = new Set();

        busySlots.forEach(slot => {
            const start = toMinutes(slot.startTime);
            const end = toMinutes(slot.endTime);

            if (currentTotalMinutes >= start && currentTotalMinutes < end) {
                // This slot is currently active
                busySubBatches.add(`${slot.batch}-${slot.subBatch}`);
            }
        });

        // 3. Find all users whose batch/subBatch is NOT in the busy list
        // We need all profiles first. Optimization: Filter in DB if possible, but 
        // constructing "NOT IN (batch, subBatch)" query for multiple pairs is complex.
        // Easier to fetch relevant fields of all profiles and filter in JS for this scale.
        const allProfiles = await Profile.find().populate('userId', ['name', 'email']);

        const freePeers = [];

        // Exclude current user
        const currentUserId = req.user.id;

        for (const profile of allProfiles) {
            // Skip current user
            if (profile.userId._id.toString() === currentUserId) continue;

            const key = `${profile.batch}-${profile.subBatch}`;

            // If their batch/subBatch is NOT in the busy set, they are free!
            if (!busySubBatches.has(key)) {

                // Also check if it's within college hours (9-5)
                // If it's outside college hours, technically everyone is "free" or "away"
                // Let's assume we only count them if it's 9-5
                if (currentTotalMinutes >= COLLEGE_START && currentTotalMinutes < COLLEGE_END) {
                    freePeers.push({
                        name: profile.userId.name,
                        batch: profile.batch,
                        subBatch: profile.subBatch
                    });
                }
            }
        }

        // Return count and first 5 peers
        res.json({
            count: freePeers.length,
            peers: freePeers.slice(0, 5) // Limit for UI
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
