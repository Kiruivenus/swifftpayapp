
const mongoose = require('mongoose');
const uri = 'mongodb+srv://edison:Qwerty254.@edisonloans.sq7fops.mongodb.net/swiftpay?retryWrites=true&w=majority';

async function verify() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const User = mongoose.connection.collection('users');
        const Transaction = mongoose.connection.collection('transactions');
        const Session = mongoose.connection.collection('sessions');
        const KycRequest = mongoose.connection.collection('kycrequests'); // Check exact collection name

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const calculateDelta = (curr, prev) => {
            if (prev === 0) return curr > 0 ? `+${(curr * 100).toFixed(1)}%` : "0.0%";
            const diff = ((curr - prev) / prev) * 100;
            return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
        };

        const userQuery = { role: { $in: ['user', 'USER'] } };
        const totalUsers = await User.countDocuments(userQuery);
        const verifiedUsers = await User.countDocuments({ ...userQuery, kycStatus: 'APPROVED' });

        const usersPrev = await User.countDocuments({ ...userQuery, createdAt: { $lt: thirtyDaysAgo } });
        const kycPrev = await User.countDocuments({ ...userQuery, kycStatus: 'APPROVED', updatedAt: { $lt: thirtyDaysAgo } });

        const financeDeltas = await Transaction.aggregate([
            {
                $match: {
                    status: 'SUCCESS',
                    createdAt: { $gt: sixtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        period: {
                            $cond: [{ $gt: ['$createdAt', thirtyDaysAgo] }, 'current', 'previous']
                        }
                    },
                    deposits: {
                        $sum: { $cond: [{ $eq: ['$type', 'DEPOSIT'] }, '$amount', 0] }
                    },
                    withdrawals: {
                        $sum: { $cond: [{ $eq: ['$type', 'WITHDRAW'] }, '$amount', 0] }
                    }
                }
            }
        ]).toArray();

        const currentFinance = financeDeltas.find(d => d._id.period === 'current') || { deposits: 0, withdrawals: 0 };
        const previousFinance = financeDeltas.find(d => d._id.period === 'previous') || { deposits: 0, withdrawals: 0 };

        const activeSessions = await Session.countDocuments({
            $or: [
                { status: 'active' },
                { isActive: true }
            ],
            // expiresAt: { $gt: now } // Skipping for verification as some might be expired but we want to see if count is non-zero
        });

        console.log('--- Results ---');
        console.log('Total Users:', totalUsers);
        console.log('Verified Users:', verifiedUsers);
        console.log('Active Sessions:', activeSessions);
        console.log('Users Delta:', calculateDelta(totalUsers, usersPrev));
        console.log('KYC Delta:', calculateDelta(verifiedUsers, kycPrev));
        console.log('Deposits Delta:', calculateDelta(currentFinance.deposits, previousFinance.deposits));
        console.log('Volume Delta:', calculateDelta(currentFinance.withdrawals, previousFinance.withdrawals));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

verify();
