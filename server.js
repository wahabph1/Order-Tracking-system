const express = require('express');
const cors = require('cors');
// .env file se variables load karne ke liye zaroori
require('dotenv').config(); 
const connectDB = require('./db/db'); 

const app = express();

// ***************************************************************
// 🔑 CRITICAL FIX: DATABASE CONNECTION KO SIRF EK BAAR KARNA HAI
// Yeh async call serverless function ke initialize hote hi chalega.
// Isse har request par connection banane ki zaroorat khatm.
connectDB(); 
// ***************************************************************

// NOTE: Aapka puraana app.use(async (req, res, next) => { ... }) code yahan se hat chuka hai.

// ***************************************************************
// CORS Configuration (Updated URL)
// ***************************************************************
const allowedOrigins = [
    'http://localhost:3000', 
    'https://order-tracking-frontend.vercel.app', 
    // Aapka latest deployed backend URL
    'https://order-tracking-system-np42.vercel.app' 
];

app.use(cors({
    origin: (origin, callback) => {
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

// 🚀 ROOT PATH HANDLER (Health Check)
app.get('/', (req, res) => {
    res.status(200).send('Order Tracking System Backend is fully operational and healthy!');
});

// Test Route
app.get('/hello', (req, res) => {
    res.send('Order Tracking Backend is running!');
});

// Order Routes
const orderRoutes = require('./routes/orderRoutes'); 
// CRITICAL FIX: Express ko batao ki /orders request ko root '/' ki tarah treat kare.
app.use('/', orderRoutes); 

// CRITICAL: Express app ko export karna zaroori hai
module.exports = app;