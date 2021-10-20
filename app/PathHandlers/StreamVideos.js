
const {multer, cloudStorage, uuidv4} = require('../Shared');
const bucket = cloudStorage.bucket("swifty_videos"); // Set Storage Bucket




function listVideos(req, res) {
    bucket.getFiles()
    .then(([files]) => {
        var fileList = []

        files.forEach(file => {
            fileList.push(file.name)
        })
        res.json(fileList)
    })
    .catch((err) => {
        console.log(err)
        res.status(530).json(err)
    })
}


async function getVideoStream(req, res) {
    var filename = req.params.filename
    if (!filename) { return res.status(405).end() }

    var file = bucket.file(filename)
    try {
        var meta = await file.getMetadata()
    } catch {
        // File doesn't exist
        return res.status(404).end()
    }
    var totalFileSize = meta[0].size
    var fileContentType = meta[0].contentType

    const range = req.range(totalFileSize)
    // console.log("totalFileSize:", totalFileSize)
    // console.log("req.headers.range", req.headers.range)
    // console.log("range():", range)
    var options = {}
    if (range) {
        if (range[0]) {
            if (range[0].start != undefined) { options.start = range[0].start }
            if (range[0].end != undefined) { options.end = range[0].end }
        }
    }
    var readStream = file.createReadStream(options)

    readStream.on('error', function(err) {
        return res.status(501).end() 
    })

    readStream.on('end', function() {
        // The file is fully downloaded.
        // console.log("bytes read: ", readStream.bytesRead)
        // console.log("bytes written: ", res.socket.bytesWritten)
        // console.log("ON END")
        res.end()
    })


    if (range) {
        if (range === -1 || range === -2) { return res.status(416).end() }
        res.status(206)
        res.set("Content-Length", range[0].end - range[0].start + 1);
        res.set("Content-Range", "bytes " + range[0].start + "-" + range[0].end + "/" + totalFileSize);
    } else {
        res.set("Content-Length", totalFileSize);
        res.status(200)
    }
    res.set("Accept-Ranges", "bytes");
    res.set("Content-Type", fileContentType);
    res.set('Cache-Control', 'public, max-age=300, immutable'); //TODO: Decide if this is the cache control I want
    readStream.pipe(res);
}

module.exports = {listVideos, getVideoStream}



