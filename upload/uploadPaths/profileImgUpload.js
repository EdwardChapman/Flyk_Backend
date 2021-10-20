
const { cloudStorage, uuidv4 } = require('../Shared');
const fs = require('fs')
const os = require('os');
const pidusage = require('pidusage')
const child_process = require('child_process');
const { query, body, validationResult } = require('express-validator');


var sql;


var uploadProfileImageSanitation = [
    // // [...a, b]
    // body('videoDescription').trim().escape(),
    // body('allowComments').isBoolean(), //true, false, 0, 1
    // body('allowReactions').isBoolean() //true, false, 0, 1
]

const compressResizePhoto = async (task) => {


    try {
       const inputFileName = "/tmp/"+ task.file.filename

        const outputFileName = "/tmp/" + uuidv4()

        var cropStripCompress = inputFileName + " -resize 200x200^ -gravity Center -extent 200x200 -strip -quality 80% JPEG:" + outputFileName
        var parsedCommand = cropStripCompress.split(' ')

        /*——————————————————————————————————————————————————*/
        /* COMPRESS & SCALE PHOTO */
        /*——————————————————————————————————————————————————*/
        var startTime = new Date()
        
        var magick = child_process.execFile('convert', parsedCommand, async function(err, stdout, stderr) {
            try {
                if (err) { 
                    fs.unlink(outputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })
                    fs.unlink(inputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })
                    return task.cb(err) 
                }
                var endTime = new Date()
                console.log("Seconds To Scale&Compress Photo:", (endTime - startTime) / 1000)

                var photoBlob;
                var nameCollision = true
                while (nameCollision) {
                    if (photoBlob) { console.warn("Collision @ ProfileImage Bucket") }
                    photoBlob = cloudStorage.bucket('swifty_profile_photos').file(uuidv4()); // Create a new blob in the bucket and upload the file data.
                    nameCollision = await photoBlob.exists()[0]
                }


                try {
                    //Upload Transcoded Video
                    await cloudStorage.bucket('swifty_profile_photos').upload(outputFileName, { destination: photoBlob, metadata: { contentType: 'image/jpeg' }, resumable: false });
                    fs.unlink(outputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })
                    fs.unlink(inputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })

                } catch (error) {
                    fs.unlink(outputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })
                    fs.unlink(inputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })
                    return task.cb(error)
                }
                return task.cb(null,
                    {
                        photoFilename: photoBlob.name
                    })

            } catch (error) {
                fs.unlink(outputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })
                fs.unlink(inputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })
                return task.cb(error)
            }
        })


        // task.pid = magick.pid
    } catch (err) {
        return task.cb(err)
    }

}




function uploadProfileImage(req, res) {
    if (!req.file) { console.error("Not enough files"); return res.status(423).end() }

    if (!req.session.user_id) { 
        // delete uploaded file when request fails.
        fs.unlink("/tmp/"+req.file.filename, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })
        return res.status(401).end() 
    }

    compressResizePhoto({file: req.file, cb: async function(err, uploadedData) {
        if (err || !uploadedData || !uploadedData.photoFilename) { console.error(err); return res.status(500).end() }

        try {
            await sql`       
                UPDATE users
                SET 
                    profile_img_filename = ${uploadedData.photoFilename}
                WHERE user_id = ${req.session.user_id} 
            `
            return res.status(200).end()
        } catch (err) {
            console.error(err)
            return res.status(500).end()
        }
    }})

}




function passInDatabase(SQL) {
    sql = SQL
    return { uploadProfileImage, uploadProfileImageSanitation }
}

module.exports = passInDatabase