const {Storage} = require('@google-cloud/storage');
const cloudStorage = new Storage()
const { v4: uuidv4 } = require('uuid');


function getDestination (req, file, cb) {
  cb(null, '/dev/null')
}

function MulterCloudStorage (opts) {
  this.getDestination = (opts.destination || getDestination)
}

MulterCloudStorage.prototype._handleFile = function _handleFile (req, file, cb) {
    this.getDestination(req, file, async function (err, bucketName) {
        if (err) return cb(err)
        try{
            const bucket = cloudStorage.bucket(bucketName); // Set Storage Bucket

            var videoBlob;
            var nameCollision = true
            while(nameCollision){
                if (videoBlob) { console.log("Collision") }
                videoBlob = bucket.file(uuidv4()); // Create a new blob in the bucket and upload the file data.
                nameCollision = await videoBlob.exists()[0]
            }
            const outStream = videoBlob.createWriteStream({resumable: false,});

            //PROBABLY NEED TO CHECK ITS EXTENSION/MIME AND PUT THAT IN METADATA
            file.stream.pipe(outStream)
            outStream.on('error', cb)
            outStream.on('finish', async function () {
                try{
                    var meta = await videoBlob.getMetadata()
                    var videoBlobSize = meta[0].size
                    if(!videoBlobSize){videoBlobSize = 50000000}
                }catch(err){
                    var videoBlobSize = 50000000
                }
                cb(null, {
                    bucketName: bucketName,
                    fileName: videoBlob.name, 
                    size: videoBlobSize
                })
            })
        }catch(err) {
            console.log(err)
            cb(err)
        }  
    })
}

MulterCloudStorage.prototype._removeFile = function _removeFile(req, file, cb) {
    try{
        cloudStorage.bucket(file.bucketName).file(file.fileName).delete().then((err, apiResponse) => {
            if (err) { console.error("MULTER COULD NOT DELETE FILE UPLOAD", err, apiResponse) }
            console.log(apiResponse)
            cb(err)
        });
    }catch(err){
        console.error(err)
        cb(err)
    }
}

module.exports = function (opts) {
  return new MulterCloudStorage(opts)
}