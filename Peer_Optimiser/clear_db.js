
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Profile = require('./models/Profile');
const Timetable = require('./models/Timetable');

dotenv.config();

const clearDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Cleanup');

        await User.deleteMany({});
        console.log('Users Cleared');

        await Profile.deleteMany({});
        console.log('Profiles Cleared');

        await Timetable.deleteMany({});
        console.log('Timetables Cleared');

        console.log('Database Cleared Successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

clearDB();
