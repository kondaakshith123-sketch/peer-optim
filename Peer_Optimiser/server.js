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
if (process.env.MONGO_URI) {
    console.log('Connecting to MongoDB...');
    mongoose.connect(process.env.MONGO_URI.trim())
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.log('MongoDB Connection Error:', err));
} else {
    console.log('MONGO_URI not found in environment variables. Running without database connection.');
}

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






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
