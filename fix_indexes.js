const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const sessionColl = collections.find(c => c.name === 'sessions');

        if (sessionColl) {
            console.log('Found sessions collection. Checking indexes...');
            const indexes = await db.collection('sessions').indexes();
            console.log(JSON.stringify(indexes, null, 2));

            const tokenIndex = indexes.find(idx => idx.name === 'token_1');
            if (tokenIndex) {
                console.log('Found problematic token_1 index. Attempting to drop it...');
                await db.collection('sessions').dropIndex('token_1');
                console.log('Successfully dropped token_1 index');
            } else {
                console.log('token_1 index not found in the list.');
            }
        } else {
            console.log('sessions collection not found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkIndexes();
