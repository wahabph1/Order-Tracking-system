// Backend/routes/orderRoutes.js (FINAL, VERCEL-READY)

const express = require('express');
const router = express.Router();
const Order = require('../db/models/OrderModel'); 

// 1. READ: Saare Orders Lao (Filtering aur Searching Support ke saath)
// Endpoint: GET /orders (Vercel par: /api/orders)
router.get('/', async (req, res) => {
    try {
        const { owner, search } = req.query; 
        const filter = {};
        
        // --- Owner Filter Logic ---
        if (owner && owner !== 'All') { 
            filter.owner = owner;
        }

        // --- Search Logic (by Serial Number) ---
        if (search) {
            // Case-insensitive regular expression search
            filter.serialNumber = { $regex: search, $options: 'i' };
        }

        // Filter object ko use karke orders dhoondhna aur latest created order pehle dikhana
        const orders = await Order.find(filter).sort({ createdAt: -1 }); 
        
        res.json(orders);
    } catch (err) {
        console.error('Order fetch error:', err.message);
        res.status(500).json({ message: 'Orders laane mein error aa gayi hai.' });
    }
});

// 2. CREATE: Naya Order Add Karo
// Endpoint: POST /orders (Vercel par: /api/orders)
router.post('/', async (req, res) => {
    const { serialNumber, owner, orderDate } = req.body;
    
    // Zaroori Fields ki Validation
    if (!serialNumber || !owner || !orderDate) {
         return res.status(400).json({ message: 'Serial Number, Owner, aur Order Date zaroori hain.' });
    }
    
    const initialStatus = 'Pending';

    const order = new Order({
        serialNumber,
        owner,
        orderDate,
        deliveryStatus: initialStatus, 
        // Order history mein pehli entry add karna
        history: [{ 
            status: initialStatus, 
            notes: 'Order created via OrderForm'
        }] 
    });
    
    try {
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (err) {
        // Unique Serial Number Error Handling (Mongoose/MongoDB code 11000)
        if (err.code === 11000) {
             return res.status(400).json({ message: 'Serial Number pehle se maujood hai.' });
        }
        console.error('Order creation error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// 3. UPDATE: Order Status/Details Update Karo
// Endpoint: PUT /orders/:id (Vercel par: /api/orders/:id)
router.put('/:id', async (req, res) => {
    const { serialNumber, owner, orderDate, deliveryStatus, notes } = req.body;
    const orderId = req.params.id;
    
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order nahi mila.' });
        }

        // 1. Serial Number Uniqueness check (agar change hua hai)
        if (serialNumber && serialNumber !== order.serialNumber) {
            const existing = await Order.findOne({ serialNumber });
            if (existing && existing._id.toString() !== orderId) {
                return res.status(400).json({ message: 'Serial Number pehle se maujood hai.' });
            }
        }
        
        // 2. History Tracking: Agar deliveryStatus change hua hai
        if (deliveryStatus && deliveryStatus !== order.deliveryStatus) {
            order.history.push({
                status: deliveryStatus,
                notes: notes || `Status updated to ${deliveryStatus} via Edit Modal` 
            });
        }
        
        // 3. Fields ko update karna (agar value provide ki gayi ho)
        order.serialNumber = serialNumber || order.serialNumber;
        order.owner = owner || order.owner;
        order.orderDate = orderDate || order.orderDate;
        order.deliveryStatus = deliveryStatus || order.deliveryStatus;
        
        const updatedOrder = await order.save(); // 'save' se pre hook (updatedAt) trigger hoga
        res.json(updatedOrder);

    } catch (err) {
        console.error('Order update error:', err.message);
        res.status(500).json({ message: 'Order update karte samay error aa gayi hai.' });
    }
});


// 4. DELETE: Order Delete Karo
// Endpoint: DELETE /orders/:id (Vercel par: /api/orders/:id)
router.delete('/:id', async (req, res) => {
    try {
        const result = await Order.findByIdAndDelete(req.params.id);
        
        if (!result) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json({ message: 'Order successfully deleted' });
    } catch (err) {
        console.error('Order deletion error:', err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
