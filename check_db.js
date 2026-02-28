
const mongoose = require('mongoose');
const uri = 'mongodb+srv://edison:Qwerty254.@edisonloans.sq7fops.mongodb.net/swiftpay?retryWrites=true&w=majority';

async function check() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const UserSchema = new mongoose.Schema({}, { strict: false });
        const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

        const total = await User.countDocuments({});
        console.log('Total users (all roles):', total);

        const roleCounts = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        console.log('Role counts:', JSON.stringify(roleCounts, null, 2));

        const kycCounts = await User.aggregate([
            { $group: { _id: '$kycStatus', count: { $sum: 1 } } }
        ]);
        console.log('KYC Status counts:', JSON.stringify(kycCounts, null, 2));

        const sample = await User.findOne({});
        console.log('Sample User Data:', JSON.stringify(sample, null, 2));

        const activeSessions = await mongoose.connection.collection('sessions').countDocuments({ status: 'active' });
        console.log('Active Sessions (status: active):', activeSessions);

        // Check if there are sessions with isActive: true
        const isActiveSessions = await mongoose.connection.collection('sessions').countDocuments({ isActive: true });
        console.log('Sessions with { isActive: true }:', isActiveSessions);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();
