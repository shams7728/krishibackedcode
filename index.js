const express = require('express');
const http = require('http'); // ✅ Import HTTP module
const socketIo = require('socket.io'); // ✅ Import Socket.io
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app); // ✅ Create HTTP server
const io = socketIo(server, {
    cors: {
        origin: "*", // ✅ Allow frontend to connect
    },
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Serve static images
app.use('/image/products', express.static('public/products'));
app.use('/image/category', express.static('public/category'));
app.use('/image/poster', express.static('public/posters'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('✅ Connected to Database'));

// WebSocket Connection
io.on("connection", (socket) => {
    console.log(`⚡ User Connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

// Attach `io` to `req` so that WebSocket can be used in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes (Pass `req.io` to use WebSocket in routes)
app.use('/categories', require('./routes/category')(io));
app.use('/subCategories', require('./routes/subCategory')(io));
app.use('/brands', require('./routes/brand')(io));
app.use('/variantTypes', require('./routes/variantType')(io));
app.use('/variants', require('./routes/variant')(io));
app.use('/products', require('./routes/product')(io));
app.use('/couponCodes', require('./routes/couponCode')(io));
app.use('/posters', require('./routes/poster')(io));
app.use('/users', require('./routes/user'));
app.use('/orders', require('./routes/order')(io));
app.use('/payment', require('./routes/payment')(io));
app.use('/notification', require('./routes/notification') (io));

// Example API Route
app.get('/', asyncHandler(async (req, res) => {
    res.json({ success: true, message: '✅ API working successfully', data: null });
}));

// Global error handler
app.use((error, req, res, next) => {
    console.error("🔥 Error:", error.message);
    res.status(500).json({ success: false, message: error.message, data: null });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
