// Vercel Serverless Function: Order Tracking Backend
// Is file ko apne project ke root folder mein maujood
// 'api' folder ke andar 'index.js' naam se save karein.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();

// ==========================================================
// 1. ENVIRONMENT VARIABLES SETUP
// VERCEL par yeh variable '__mongo_uri' ke naam se set hoga
// ==========================================================
const MONGODB_URI = typeof __mongo_uri !== 'undefined' ? __mongo_uri : 'mongodb://localhost:27017/orderTracker';

// ==========================================================
// 2. MIDDLEWARE
// ==========================================================
// CORS: allow frontend origin and handle preflight
const corsOptions = {
    origin: 'https://order-f.vercel.app',
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json()); 

// ==========================================================
// 3. MONGODB CONNECTION
// ==========================================================
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('MongoDB se safaltapoorvak connect ho gaya hai.');
    })
    .catch(err => {
        console.error('MongoDB connection mein error hai:', err.message);
    });

// ==========================================================
// 4. ORDER SCHEMA (Database Structure)
// ==========================================================
const OrderSchema = new mongoose.Schema({
    serialNumber: { type: String, required: true, unique: true },
    owner: { type: String, required: true },
    orderDate: { type: Date, required: true },
    deliveryStatus: { type: String, required: true, default: 'Pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    history: [{
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String }
    }]
});

OrderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Order = mongoose.model('Order', OrderSchema);

// ==========================================================
// 5. API ROUTES (/api/orders)
// ==========================================================

// POST /api/orders - Naya Order banao
app.post('/api/orders', async (req, res) => {
    try {
        const { serialNumber, owner, orderDate } = req.body;

        const existingOrder = await Order.findOne({ serialNumber });
        if (existingOrder) {
            return res.status(400).json({ message: 'Serial Number pehle se maujood hai.' });
        }

        const newOrder = new Order({
            serialNumber,
            owner,
            orderDate,
            deliveryStatus: 'Pending',
            history: [{ status: 'Pending', notes: 'Order created.' }]
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ message: 'Order banane mein error aa gayi hai.' });
    }
});

// GET /api/orders - Saare Orders dekho, Search aur Filter ke saath
app.get('/api/orders', async (req, res) => {
    try {
        const { owner, search } = req.query;
        let query = {};

        if (owner) {
            query.owner = owner;
        }

        if (search) {
            query.serialNumber = { $regex: search, $options: 'i' }; 
        }

        const orders = await Order.find(query).sort({ createdAt: -1 }); 
        res.json(orders);
    } catch (err) {
        console.error('Order fetch error:', err);
        res.status(500).json({ message: 'Orders laane mein error aa gayi hai.' });
    }
});

// PUT /api/orders/:id - Maujooda Order ko Update karo
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { serialNumber, owner, orderDate, deliveryStatus, notes } = req.body;
        const orderId = req.params.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order nahi mila.' });
        }

        if (serialNumber !== order.serialNumber) {
            const existing = await Order.findOne({ serialNumber });
            if (existing && existing._id.toString() !== orderId) {
                return res.status(400).json({ message: 'Serial Number pehle se maujood hai.' });
            }
        }
        
        if (deliveryStatus !== order.deliveryStatus) {
            order.history.push({
                status: deliveryStatus,
                notes: notes || `Status updated to ${deliveryStatus}` 
            });
        }
        
        order.serialNumber = serialNumber;
        order.owner = owner;
        order.orderDate = orderDate;
        order.deliveryStatus = deliveryStatus;
        
        await order.save();
        res.json(order);
    } catch (err) {
        console.error('Order update error:', err);
        res.status(500).json({ message: 'Order update karne mein error aa gayi hai.' });
    }
});

// DELETE /api/orders/:id - Order ko Delete karo
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const result = await Order.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({ message: 'Order nahi mila.' });
        }
        res.status(200).json({ message: 'Order safaltapoorvak delete ho gaya hai.' });
    } catch (err) {
        console.error('Order deletion error:', err);
        res.status(500).json({ message: 'Order delete karne mein error aa gayi hai.' });
    }
});

// Vercel deployment ke liye: Express app ko export karein
module.exports = app;