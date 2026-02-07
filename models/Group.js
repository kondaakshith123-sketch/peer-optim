const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    interestTag: {
        type: String,
        required: true,
        unique: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    expiryTime: {
        type: Date,
        required: true
    },
    durationMinutes: {
        type: Number,
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);
