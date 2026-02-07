const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory



// MongoDB Connection
const connectDB = async () => {
    if (process.env.MONGO_URI) {
        console.log('Connecting to MongoDB...');
        try {
            await mongoose.connect(process.env.MONGO_URI.trim());
            console.log('MongoDB Connected');
        } catch (err) {
            console.error('MongoDB Connection Error:', err.message);
            console.log('Falling back to In-Memory Database for Demo Mode...');
            await setupInMemoryDB();
        }
    } else {
        console.log('MONGO_URI not found. Starting In-Memory Database for Demo Mode...');
        await setupInMemoryDB();
    }
};

const setupInMemoryDB = async () => {
    try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('In-Memory MongoDB Started & Connected (Data will NOT be saved persistently)');
    } catch (err) {
        console.error('Failed to start In-Memory MongoDB:', err.message);
    }
};

connectDB();

// Serve landing.html for root path
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/landing.html');
});


// Define Routes

// Define Routes

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/match', require('./routes/match'));
app.use('/api/groups', require('./routes/groups'));






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Background Cleanup Job for Groups
const Group = require('./models/Group');
setInterval(async () => {
    try {
        const now = new Date();
        const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

        // 1. Delete groups older than 2 mins with only 1 member
        await Group.deleteMany({
            members: { $size: 1 },
            startTime: { $lt: twoMinutesAgo }
        });

        // 2. Mark groups as inactive if they have expired
        await Group.updateMany(
            { isActive: true, expiryTime: { $lt: now } },
            { $set: { isActive: false } }
        );

        // Optional: Hard delete expired groups if preferred
        // await Group.deleteMany({ expiryTime: { $lt: now } });

    } catch (err) {
        console.error('Cleanup Error:', err.message);
    }
}, 60 * 1000); // Run every minute
