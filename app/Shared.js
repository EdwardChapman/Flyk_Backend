
const { v4: uuidv4 } = require('uuid');
const Multer = require('multer');
const {Storage} = require('@google-cloud/storage');
// const cloudStorage = new Storage() // Instantiate a storage client
const cloudStorage = new Storage({keyFilename: "./serviceAccountCert/swiftytest-edf4e57113c6.json"});
// Multer is required to process file uploads and make them available via req.files
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // in Bytes
    },
    fileFilter: fileFilter
});
function fileFilter (req, file, cb) {
    console.log(file); return cb(null, true)
}

module.exports = {multer, cloudStorage, uuidv4}