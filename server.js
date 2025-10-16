const express = require('express');
const cors = require('cors');
// .env file se variables load karne ke liye zaroori
require('dotenv').config(); 
const connectDB = require('./db/models/OrderModel'); 

const app = express();

// Middleware: Database Connection Management
app.use(async (req, res, next) => {
    // connectDB function se database connection establish karein
    await connectDB(); 
    next();
});

// ***************************************************************
// 🛠️ CRITICAL FIX: CORS Configuration for all Deployed URLs
// ***************************************************************
const allowedOrigins = [
    'http://localhost:3000', 
    'https://order-tracking-frontend.vercel.app', 
    // Aapka deployed backend URL
    'https://order-tracking-system-git-main-wahabph1s-projects.vercel.app' 
];

app.use(cors({
    origin: (origin, callback) => {
        // Agar origin undefined ho ya list mein ho, toh allow karein
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS for origin: ${origin}`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
// ***************************************************************

app.use(express.json()); 

// 🚀 ROOT PATH HANDLER (For checking server health)
app.get('/', (req, res) => {
    res.status(200).send('Order Tracking System Backend is fully operational and healthy!');
});

// Test Route
app.get('/hello', (req, res) => {
    res.send('Order Tracking Backend is running!');
});

// Order Routes
const orderRoutes = require('./routes/orderRoutes'); 
// 🔑 FINAL FIX: Yahan sirf '/' hona chahiye taaki Vercel ka routing theek ho.
app.use('/', orderRoutes); 

// CRITICAL: Express app ko export karna zaroori hai
module.exports = app;