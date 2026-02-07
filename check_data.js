const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Timetable = require('./models/Timetable');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const data = await Timetable.find({ subBatch: { $in: ['A1', 'A2'] } }).limit(5);
        console.log('Sample Data:', JSON.stringify(data, null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
