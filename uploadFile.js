const multer = require('multer');
const path = require('path');

// Serve files from a dedicated 'uploads' folder
const storageCategory = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/category')); // Use absolute path
  },
  filename: function (req, file, cb) {
    const extname = path.extname(file.originalname).toLowerCase();
    const filetypes = /jpeg|jpg|png/;
    if (filetypes.test(extname)) {
      cb(null, Date.now() + "_" + Math.floor(Math.random() * 1000) + extname);
    } else {
      cb(new Error("Only .jpeg, .jpg, .png files are allowed!"));
    }
  }
});

const uploadCategory = multer({ storage: storageCategory, limits: { fileSize: 5 * 1024 * 1024 } });

const storageProduct = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/products'));
  },
  filename: function (req, file, cb) {
    const extname = path.extname(file.originalname).toLowerCase();
    const filetypes = /jpeg|jpg|png/;
    if (filetypes.test(extname)) {
      cb(null, Date.now() + "_" + file.originalname);
    } else {
      cb(new Error("Only .jpeg, .jpg, .png files are allowed!"));
    }
  }
});

const uploadProduct = multer({ storage: storageProduct, limits: { fileSize: 5 * 1024 * 1024 } });

const storagePoster = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/posters'));
  },
  filename: function (req, file, cb) {
    const extname = path.extname(file.originalname).toLowerCase();
    const filetypes = /jpeg|jpg|png/;
    if (filetypes.test(extname)) {
      cb(null, Date.now() + "_" + file.originalname);
    } else {
      cb(new Error("Only .jpeg, .jpg, .png files are allowed!"));
    }
  }
});

const uploadPosters = multer({ storage: storagePoster, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { uploadCategory, uploadProduct, uploadPosters };
