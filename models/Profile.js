const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String
    },

    rollNo: {
        type: String
    },
    batch: {
        type: String // e.g. "ABCD"
    },
    subBatch: {
        type: String // e.g. "A1"
    },
    branch: {

        type: String
    },
    year: {
        type: String
    },
    section: {
        type: String
    },
    bio: {
        type: String
    },
    skills: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);
