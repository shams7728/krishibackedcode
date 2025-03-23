const express = require('express');
const router = express.Router();
const Variant = require('../model/variant');
const Product = require('../model/product');
const asyncHandler = require('express-async-handler');

module.exports = (io) => {

// Get all variants
router.get('/', asyncHandler(async (req, res) => {
    try {
        const variants = await Variant.find().populate('variantTypeId').sort({ 'variantTypeId': 1 });
        res.json({ success: true, message: "Variants retrieved successfully.", data: variants });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a variant by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const variant = await Variant.findById(req.params.id).populate('variantTypeId');
        if (!variant) {
            return res.status(404).json({ success: false, message: "Variant not found." });
        }
        res.json({ success: true, message: "Variant retrieved successfully.", data: variant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new variant
router.post('/', asyncHandler(async (req, res) => {
    const { name, variantTypeId } = req.body;
    if (!name || !variantTypeId) {
        return res.status(400).json({ success: false, message: "Name and VariantType ID are required." });
    }

    try {
        // Check for duplicate variant name within the same variantTypeId
        const existingVariant = await Variant.findOne({ name, variantTypeId });
        if (existingVariant) {
            return res.status(400).json({ success: false, message: "Variant with this name already exists in this Variant Type." });
        }

        const variant = new Variant({ name, variantTypeId });
        await variant.save();

        // Emit WebSocket event for new variant
        io.emit('variantUpdate', { action: 'added', data: { name, variantTypeId } });

        res.json({ success: true, message: "Variant created successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update a variant
router.put('/:id', asyncHandler(async (req, res) => {
    const { name, variantTypeId } = req.body;
    if (!name || !variantTypeId) {
        return res.status(400).json({ success: false, message: "Name and VariantType ID are required." });
    }

    try {
        // Check if variant exists
        const updatedVariant = await Variant.findByIdAndUpdate(req.params.id, { name, variantTypeId }, { new: true });
        if (!updatedVariant) {
            return res.status(404).json({ success: false, message: "Variant not found." });
        }

        io.emit('variantUpdate', { action: 'updated', data: { id: updatedVariant._id, name, variantTypeId } });

        res.json({ success: true, message: "Variant updated successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a variant
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        // Check if any products reference this variant
        const products = await Product.find({ proVariantId: req.params.id });
        if (products.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete. Products are referencing this Variant." });
        }

        // Delete the variant
        const variant = await Variant.findByIdAndDelete(req.params.id);
        if (!variant) {
            return res.status(404).json({ success: false, message: "Variant not found." });
        }

        io.emit('variantUpdate', { action: 'deleted', data: { id: req.params.id } });

        res.json({ success: true, message: "Variant deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

return router;
};
