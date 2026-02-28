import mongoose from 'mongoose';
import process from 'node:process';

const MONGODB_URI = "mongodb+srv://edison:Qwerty254.@edisonloans.sq7fops.mongodb.net/swiftpay?retryWrites=true&w=majority";

async function checkIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const db = mongoose.connection.db;
        console.log('Checking sessions collection...');
        const indexes = await db.collection('sessions').indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

        const tokenIndex = indexes.find(idx => idx.name === 'token_1');
        if (tokenIndex) {
            console.log('Found problematic token_1 index. Attempting to drop it...');
            await db.collection('sessions').dropIndex('token_1');
            console.log('Successfully dropped token_1 index');
        } else {
            console.log('token_1 index not found.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkIndexes();
