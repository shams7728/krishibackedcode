const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const Order = require('../model/order');

module.exports = (io) => {

// Get all orders
router.get('/', asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('userID', 'id name')
            .sort({ _id: -1 });
        res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get orders by User ID
router.get('/orderByUserId/:userId', asyncHandler(async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await Order.find({ userID: userId })
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('userID', 'id name')
            .sort({ _id: -1 });
        res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get order by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const order = await Order.findById(orderID)
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('userID', 'id name');
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        res.json({ success: true, message: "Order retrieved successfully.", data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new order
router.post('/', asyncHandler(async (req, res) => {
    const { userID, orderStatus, items, totalPrice, shippingAddress, paymentMethod, couponCode, orderTotal, trackingUrl } = req.body;

    if (!userID || !items || !totalPrice || !shippingAddress || !paymentMethod || !orderTotal) {
        return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    try {
        const order = new Order({ userID, orderStatus, items, totalPrice, shippingAddress, paymentMethod, couponCode, orderTotal, trackingUrl });
        const newOrder = await order.save();

        // Emit WebSocket event for new order
        io.emit('orderUpdate', { action: 'add', data: newOrder });

        res.json({ success: true, message: "Order created successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update an order
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const { orderStatus, trackingUrl } = req.body;
        if (!orderStatus) {
            return res.status(400).json({ success: false, message: "Order status required." });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderID,
            { orderStatus, trackingUrl },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Emit WebSocket event for order update
        io.emit('orderUpdate', { action: 'update', data: updatedOrder });

        res.json({ success: true, message: "Order updated successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete an order
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const deletedOrder = await Order.findByIdAndDelete(orderID);
        if (!deletedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Emit WebSocket event for order deletion
        io.emit('orderUpdate', { action: 'delete', data: orderID });

        res.json({ success: true, message: "Order deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

return router;
};
