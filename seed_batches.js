const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Timetable = require('./models/Timetable');

dotenv.config();

const SYSTEM_USER_ID = '67a50505197416e324f64d13';

const subBatches = ['A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3'];
const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const subjects = [
    { name: 'DSA', faculty: 'Dr. Arun Kumar', room: 'LT-1' },
    { name: 'DBMS', faculty: 'Prof. S. Sharma', room: 'LT-2' },
    { name: 'OS', faculty: 'Dr. Vivek Singh', room: 'LT-3' },
    { name: 'COA', faculty: 'Dr. Meena Gupta', room: 'Lab-1' },
    { name: 'Maths-III', faculty: 'Prof. K. Raj', room: 'LT-4' },
    { name: 'AI', faculty: 'Dr. Pooja Jain', room: 'LT-1' },
    { name: 'CN', faculty: 'Mr. Rahul Verma', room: 'Lab-2' }
];

const timeSlots = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:15', end: '12:15' },
    { start: '12:15', end: '13:15' },
    { start: '14:30', end: '15:30' },
    { start: '15:30', end: '16:30' }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        const entries = [];

        for (const subBatch of subBatches) {
            const batch = subBatch[0];
            for (const day of days) {
                // Pick 5-6 random slots for each day
                const slotsCount = 5 + Math.floor(Math.random() * 2);
                const daySlots = [...timeSlots].sort(() => 0.5 - Math.random()).slice(0, slotsCount);

                daySlots.forEach(slot => {
                    const subject = subjects[Math.floor(Math.random() * subjects.length)];
                    entries.push({
                        userId: SYSTEM_USER_ID,
                        day,
                        batch,
                        subBatch,
                        startTime: slot.start,
                        endTime: slot.end,
                        subject: subject.name,
                        location: `${subject.faculty} | ${subject.room}`,
                        isCancelled: false
                    });
                });
            }
        }

        console.log(`Prepared ${entries.length} entries. Inserting...`);
        await Timetable.insertMany(entries);
        console.log('Seeding completed successfully!');
        process.exit();
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
