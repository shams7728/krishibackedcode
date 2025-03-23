const express = require('express');
const router = express.Router();
const Category = require('../model/category');
const SubCategory = require('../model/subCategory');
const Product = require('../model/product');
const { uploadCategory } = require('../uploadFile');
const multer = require('multer');
const asyncHandler = require('express-async-handler');

module.exports = (io) => {
    // Get all categories
    router.get('/', asyncHandler(async (req, res) => {
        try {
            const categories = await Category.find();
            res.json({ success: true, message: "Categories retrieved successfully.", data: categories });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }));

    // Create a new category with image upload
    router.post('/', asyncHandler(async (req, res) => {
        try {
            uploadCategory.single('img')(req, res, async function (err) {
                if (err instanceof multer.MulterError) {
                    return res.json({ success: false, message: err.message });
                } else if (err) {
                    return res.json({ success: false, message: err.message });
                }

                const { name } = req.body;
                let imageUrl = 'no_url';
                if (req.file) {
                    imageUrl = `http://192.168.0.203:3000/image/category/${req.file.filename}`;
                }
                
                if (!name) {
                    return res.status(400).json({ success: false, message: "Name is required." });
                }
                
                const newCategory = new Category({ name, image: imageUrl });
                await newCategory.save();
                
                // Emit WebSocket event
                io.emit('categoryUpdated', { action: 'add', category: newCategory });
                res.json({ success: true, message: "Category created successfully.", data: newCategory });
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }));

    // Update a category
    router.put('/:id', asyncHandler(async (req, res) => {
        try {
            const categoryID = req.params.id;
            const { name } = req.body;
            let image = req.body.image;
            
            if (req.file) {
                image = `http://192.168.0.203:3000/image/category/${req.file.filename}`;
            }
            
            if (!name || !image) {
                return res.status(400).json({ success: false, message: "Name and image are required." });
            }
            
            const updatedCategory = await Category.findByIdAndUpdate(categoryID, { name, image }, { new: true });
            if (!updatedCategory) {
                return res.status(404).json({ success: false, message: "Category not found." });
            }
            
            // Emit WebSocket event
            io.emit('categoryUpdated', { action: 'update', category: updatedCategory });
            res.json({ success: true, message: "Category updated successfully.", data: updatedCategory });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }));

    // Delete a category
    router.delete('/:id', asyncHandler(async (req, res) => {
        try {
            const categoryID = req.params.id;
            const category = await Category.findByIdAndDelete(categoryID);
            if (!category) {
                return res.status(404).json({ success: false, message: "Category not found." });
            }
            
            // Emit WebSocket event
            io.emit('categoryUpdated', { action: 'delete', categoryID });
            res.json({ success: true, message: "Category deleted successfully." });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }));
    
    return router;
};
