
const { v4: uuidv4 } = require('uuid');
const Multer = require('multer');

const {Storage} = require('@google-cloud/storage');
const cloudStorage = new Storage() // Instantiate a storage client

const multerCloudStorage = require("./MulterCloudStorage")


// Multer is required to process file uploads and make them available via req.files


const multer = Multer({
    storage: multerCloudStorage({
      destination: function (req, file, cb) {
        cb(null, 'swifty_upload')
      }
    }),
    limits: {
      fileSize: 200 * 1024 * 1024, // in Bytes
    },
    fileFilter: fileFilter
});

const multerMEM = Multer({
  storage: Multer.diskStorage({
    destination: '/tmp/',
    filename: function (req, file, cb) {
      cb(null, uuidv4())
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // in Bytes
  },
  fileFilter: fileFilter
});


function fileFilter(req, file, cb) {
  // file ~= { fieldname: 'video', originalname: 'video', encoding: '7bit', mimetype: 'video/mp4' }
  return cb(null, true)
}

module.exports = {multer, multerMEM, cloudStorage, uuidv4}