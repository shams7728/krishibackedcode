const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config(); // Load environment variables

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for Categories
const storageCategory = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "categories",
    allowed_formats: ["jpeg", "jpg", "png"],
    resource_type: "image" // Ensure it only allows image uploads
  },
});

const uploadCategory = multer({ storage: storageCategory });

// Storage for Products
const storageProduct = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpeg", "jpg", "png"],
    resource_type: "image"
  },
});

const uploadProduct = multer({ storage: storageProduct });

// Storage for Posters
const storagePoster = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "posters",
    allowed_formats: ["jpeg", "jpg", "png"],
    resource_type: "image"
  },
});

const uploadPosters = multer({ storage: storagePoster });

module.exports = {
  uploadCategory,
  uploadProduct,
  uploadPosters,
};
