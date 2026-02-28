
const mongoose = require('mongoose');
const fs = require('fs');
const uri = 'mongodb+srv://edison:Qwerty254.@edisonloans.sq7fops.mongodb.net/swiftpay?retryWrites=true&w=majority';

async function check() {
    try {
        await mongoose.connect(uri);
        const results = {};

        const User = mongoose.connection.collection('users');
        results.totalUsers = await User.countDocuments({});

        results.roleCounts = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]).toArray();

        results.kycCounts = await User.aggregate([
            { $group: { _id: '$kycStatus', count: { $sum: 1 } } }
        ]).toArray();

        const sessions = mongoose.connection.collection('sessions');
        results.activeSessionsStatus = await sessions.countDocuments({ status: 'active' });
        results.activeSessionsIsActive = await sessions.countDocuments({ isActive: true });

        const sampleSession = await sessions.findOne({});
        results.sampleSessionFields = Object.keys(sampleSession || {});

        fs.writeFileSync('db_results.json', JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('db_results_error.txt', err.stack);
        process.exit(1);
    }
}

check();
