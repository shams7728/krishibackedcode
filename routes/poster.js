const express = require('express');
const router = express.Router();
const Poster = require('../model/poster');
const { uploadPosters } = require('../uploadFile');
const multer = require('multer');
const asyncHandler = require('express-async-handler');

// Get all posters
router.get('/', asyncHandler(async (req, res) => {
    try {
        const posters = await Poster.find({});
        res.json({ success: true, message: "Posters retrieved successfully.", data: posters });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a poster by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const posterID = req.params.id;
        const poster = await Poster.findById(posterID);
        if (!poster) {
            return res.status(404).json({ success: false, message: "Poster not found." });
        }
        res.json({ success: true, message: "Poster retrieved successfully.", data: poster });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new poster & send WebSocket event
router.post('/', asyncHandler(async (req, res) => {
    try {
        uploadPosters.single('img')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.json({ success: false, message: err.message });
            } else if (err) {
                return res.json({ success: false, message: err });
            }

            const { posterName } = req.body;
            let imageUrl = 'no_url';
            if (req.file) {
                imageUrl = `https://krishibackedcode.onrender.com/uploads/poster/${req.file.filename}`;
            }

            if (!posterName) {
                return res.status(400).json({ success: false, message: "Name is required." });
            }

            try {
                const newPoster = new Poster({
                    posterName: posterName,
                    imageUrl: imageUrl
                });

                await newPoster.save();

                // Emit WebSocket event for new poster
                req.io.emit('poster_created', newPoster);

                res.json({ success: true, message: "Poster created successfully.", data: newPoster });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}));

// Update a poster & send WebSocket event
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const posterID = req.params.id;

        uploadPosters.single('img')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.json({ success: false, message: err.message });
            } else if (err) {
                return res.json({ success: false, message: err.message });
            }

            const { posterName } = req.body;
            let image = req.body.image;

            if (req.file) {
                image = `https://krishibackedcode.onrender.com/uploads/poster/${req.file.filename}`;
            }

            if (!posterName || !image) {
                return res.status(400).json({ success: false, message: "Name and image are required." });
            }

            try {
                const updatedPoster = await Poster.findByIdAndUpdate(
                    posterID,
                    { posterName: posterName, imageUrl: image },
                    { new: true }
                );

                if (!updatedPoster) {
                    return res.status(404).json({ success: false, message: "Poster not found." });
                }

                // Emit WebSocket event for poster update
                req.io.emit('poster_updated', updatedPoster);

                res.json({ success: true, message: "Poster updated successfully.", data: updatedPoster });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}));

// Delete a poster & send WebSocket event
router.delete('/:id', asyncHandler(async (req, res) => {
    const posterID = req.params.id;
    try {
        const deletedPoster = await Poster.findByIdAndDelete(posterID);

        if (!deletedPoster) {
            return res.status(404).json({ success: false, message: "Poster not found." });
        }

        // Emit WebSocket event for poster deletion
        req.io.emit('poster_deleted', { posterID });

        res.json({ success: true, message: "Poster deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
