const express = require('express');
const http = require('http');  
const { Server } = require('socket.io');  
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);

// Load IP and PORT from .env or use defaults
const IP_ADDRESS = process.env.SERVER_IP || '0.0.0.0'; // Default: Bind to all interfaces
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO
const io = new Server(server, {
    cors: { origin: '*' }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Serve static files
app.use('/image/products', express.static('public/products'));
app.use('/image/category', express.static('public/category'));
app.use('/image/poster', express.static('public/posters'));

// MongoDB Connection
const URL = process.env.MONGO_URL;
mongoose.connect(URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('✅ Connected to Database'));

// WebSocket Connection
io.on('connection', (socket) => {
    console.log(`⚡ Client Connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`❌ Client Disconnected: ${socket.id}`);
    });
});

// Pass io instance to all route files
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/categories', require('./routes/category'));
app.use('/subCategories', require('./routes/subCategory'));
app.use('/brands', require('./routes/brand'));
app.use('/variantTypes', require('./routes/variantType'));
app.use('/variants', require('./routes/variant'));
app.use('/products', require('./routes/product'));
app.use('/couponCodes', require('./routes/couponCode'));
app.use('/posters', require('./routes/poster'));
app.use('/users', require('./routes/user'));
app.use('/orders', require('./routes/order'));
app.use('/payment', require('./routes/payment'));
app.use('/notification', require('./routes/notification'));

// Example route
app.get('/', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'API working successfully', data: null });
}));

// Global error handler
app.use((error, req, res, next) => {
    res.status(500).json({ success: false, message: error.message, data: null });
});

// Start server on specified IP & PORT
server.listen(PORT, IP_ADDRESS, () => {
    console.log(`🚀 Server running on http://${IP_ADDRESS}:${PORT}`);
});
