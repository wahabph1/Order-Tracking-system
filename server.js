const express = require('express');
const cors = require('cors');
// .env file se variables load karne ke liye zaroori
require('dotenv').config(); 
const connectDB = require('./db/db'); // Assuming this path is correct

const app = express();

// Middleware: Database Connection Management
// Har request se pehle database se connect karein aur caching use karein
app.use(async (req, res, next) => {
    // connectDB function se database connection establish karein
    await connectDB(); 
    next();
});

// ***************************************************************
// 🛠️ CRITICAL FIX: CORS Configuration for all Deployed URLs
// ***************************************************************
const allowedOrigins = [
    // 1. Localhost development ke liye
    'http://localhost:3000', 
    
    // 2. Deployed Frontend URL (Latest URL)
    'https://order-tracking-frontend.vercel.app', 
    
    // 3. Deployed Backend URL (Self-call allow karne ke liye)
    'https://order-tracking-system-git-main-wahabph1s-projects.vercel.app' 
];

app.use(cors({
    origin: (origin, callback) => {
        // Agar origin undefined ho (jaise ki server-to-server calls), ya list mein ho, toh allow karein
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

// Test Route
app.get('/hello', (req, res) => {
    res.send('Order Tracking Backend is running!');
});

// Order Routes (CRITICAL: /api path Vercel khud jodega, isliye yahan sirf /orders)
const orderRoutes = require('./routes/orderRoutes'); // Assuming this path is correct
app.use('/orders', orderRoutes);

// CRITICAL: Express app ko export karna zaroori hai (app.listen() hata diya gaya hai)
module.exports = app;
