const express = require('express');
const router = express.Router();
const VariantType = require('../model/variantType');
const Product = require('../model/product');
const Variant = require('../model/variant');
const asyncHandler = require('express-async-handler');

module.exports = (io) => {

// Get all variant types
router.get('/', asyncHandler(async (req, res) => {
    try {
        const variantTypes = await VariantType.find();
        res.json({ success: true, message: "Variant Types retrieved successfully.", data: variantTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a variant type by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const variantType = await VariantType.findById(req.params.id);
        if (!variantType) {
            return res.status(404).json({ success: false, message: "Variant Type not found." });
        }
        res.json({ success: true, message: "Variant Type retrieved successfully.", data: variantType });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new variant type
router.post('/', asyncHandler(async (req, res) => {
    const { name, type } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: "Name is required." });
    }

    try {
        // Check for duplicate variant type
        const existingVariantType = await VariantType.findOne({ name });
        if (existingVariantType) {
            return res.status(400).json({ success: false, message: "Variant Type already exists." });
        }

        const variantType = new VariantType({ name, type });
        await variantType.save();

        // Emit WebSocket event for new variant type
        io.emit('variantTypeUpdate', { action: 'added', data: { name, type } });

        res.json({ success: true, message: "Variant Type created successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update a variant type
router.put('/:id', asyncHandler(async (req, res) => {
    const { name, type } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: "Name is required." });
    }

    try {
        const updatedVariantType = await VariantType.findByIdAndUpdate(req.params.id, { name, type }, { new: true });
        if (!updatedVariantType) {
            return res.status(404).json({ success: false, message: "Variant Type not found." });
        }

        io.emit('variantTypeUpdate', { action: 'updated', data: { id: updatedVariantType._id, name, type } });

        res.json({ success: true, message: "Variant Type updated successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a variant type
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        // Check if any variant is associated with this variant type
        const variantCount = await Variant.countDocuments({ variantTypeId: req.params.id });
        if (variantCount > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete. This Variant Type is associated with variants." });
        }

        // Check if any products reference this variant type
        const products = await Product.find({ proVariantTypeId: req.params.id });
        if (products.length > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete. Products are referencing this Variant Type." });
        }

        // Delete the variant type
        const variantType = await VariantType.findByIdAndDelete(req.params.id);
        if (!variantType) {
            return res.status(404).json({ success: false, message: "Variant Type not found." });
        }

        io.emit('variantTypeUpdate', { action: 'deleted', data: { id: req.params.id } });

        res.json({ success: true, message: "Variant Type deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

return router;
};
