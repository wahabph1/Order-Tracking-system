// backend/db/db.js

const mongoose = require('mongoose');

// URI ko process.env se fetch karein
const uri = process.env.MONGO_URI; 

// Connection Cache Variable for Serverless
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        console.log('=> Using existing database connection (Serverless Cache).');
        return cached.conn;
    }
    
    if (!cached.promise) {
        if (!uri) {
             throw new Error('MONGO_URI is not defined in environment variables.');
        }

        const opts = {
            bufferCommands: false, // Serverless mein commands ko buffer karna off rakhte hain
        };

        cached.promise = mongoose.connect(uri, opts).then(mongoose => {
            return mongoose;
        });
    }
    
    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error('MongoDB connection failed:', error.message);
        process.exit(1); 
    }

    return cached.conn;
};

module.exports = connectDB;