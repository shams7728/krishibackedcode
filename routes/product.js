const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const multer = require('multer');
const { uploadProduct } = require('../uploadFile');
const asyncHandler = require('express-async-handler');

// Get all products
router.get('/', asyncHandler(async (req, res) => {
    try {
        const products = await Product.find()
            .populate('proCategoryId', 'id name')
            .populate('proSubCategoryId', 'id name')
            .populate('proBrandId', 'id name')
            .populate('proVariantTypeId', 'id type')
            .populate('proVariantId', 'id name');
        res.json({ success: true, message: "Products retrieved successfully.", data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a product by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const productID = req.params.id;
        const product = await Product.findById(productID)
            .populate('proCategoryId', 'id name')
            .populate('proSubCategoryId', 'id name')
            .populate('proBrandId', 'id name')
            .populate('proVariantTypeId', 'id name')
            .populate('proVariantId', 'id name');
        
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        // Generate the shareable link
        const shareableLink = `https://krishibackedcode.onrender.com/product/${product._id}`;

        res.json({
            success: true,
            message: "Product retrieved successfully.",
            data: { ...product.toObject(), shareableLink }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create new product & send WebSocket event
router.post('/', asyncHandler(async (req, res) => {
    try {
        uploadProduct.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
            { name: 'image4', maxCount: 1 },
            { name: 'image5', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.json({ success: false, message: err.message });
            } else if (err) {
                return res.json({ success: false, message: err });
            }

            const { name, description, quantity, price, offerPrice, proCategoryId, proSubCategoryId, proBrandId, proVariantTypeId, proVariantId } = req.body;

            if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
                return res.status(400).json({ success: false, message: "Required fields are missing." });
            }

            const imageUrls = [];
            const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
            fields.forEach((field, index) => {
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    const imageUrl = `https://krishibackedcode.onrender.com/image/products/${file.filename}`;
                    imageUrls.push({ image: index + 1, url: imageUrl });
                }
            });

            const newProduct = new Product({
                name, description, quantity, price, offerPrice, proCategoryId,
                proSubCategoryId, proBrandId, proVariantTypeId, proVariantId, images: imageUrls
            });

            await newProduct.save();

            // Emit WebSocket event for new product
            req.io.emit('product_created', newProduct);

            res.json({ success: true, message: "Product created successfully.", data: newProduct });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update product & send WebSocket event
router.put('/:id', asyncHandler(async (req, res) => {
    const productId = req.params.id;
    try {
        uploadProduct.fields([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
            { name: 'image3', maxCount: 1 },
            { name: 'image4', maxCount: 1 },
            { name: 'image5', maxCount: 1 }
        ])(req, res, async function (err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }

            const { name, description, quantity, price, offerPrice, proCategoryId, proSubCategoryId, proBrandId, proVariantTypeId, proVariantId } = req.body;

            const productToUpdate = await Product.findById(productId);
            if (!productToUpdate) {
                return res.status(404).json({ success: false, message: "Product not found." });
            }

            productToUpdate.name = name || productToUpdate.name;
            productToUpdate.description = description || productToUpdate.description;
            productToUpdate.quantity = quantity || productToUpdate.quantity;
            productToUpdate.price = price || productToUpdate.price;
            productToUpdate.offerPrice = offerPrice || productToUpdate.offerPrice;
            productToUpdate.proCategoryId = proCategoryId || productToUpdate.proCategoryId;
            productToUpdate.proSubCategoryId = proSubCategoryId || productToUpdate.proSubCategoryId;
            productToUpdate.proBrandId = proBrandId || productToUpdate.proBrandId;
            productToUpdate.proVariantTypeId = proVariantTypeId || productToUpdate.proVariantTypeId;
            productToUpdate.proVariantId = proVariantId || productToUpdate.proVariantId;

            const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];
            fields.forEach((field, index) => {
                if (req.files[field] && req.files[field].length > 0) {
                    const file = req.files[field][0];
                    const imageUrl = `https://krishibackedcode.onrender.com/image/products/${file.filename}`;
                    let imageEntry = productToUpdate.images.find(img => img.image === (index + 1));
                    if (imageEntry) {
                        imageEntry.url = imageUrl;
                    } else {
                        productToUpdate.images.push({ image: index + 1, url: imageUrl });
                    }
                }
            });

            await productToUpdate.save();

            // Emit WebSocket event for product update
            req.io.emit('product_updated', productToUpdate);

            res.json({ success: true, message: "Product updated successfully.", data: productToUpdate });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete product & send WebSocket event
router.delete('/:id', asyncHandler(async (req, res) => {
    const productID = req.params.id;
    try {
        const product = await Product.findByIdAndDelete(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        // Emit WebSocket event for product deletion
        req.io.emit('product_deleted', { productID });

        res.json({ success: true, message: "Product deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
