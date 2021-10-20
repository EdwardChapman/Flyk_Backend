
const { cloudStorage, uuidv4 } = require('../Shared');
const fs = require('fs')

const os = require('os');
const pidusage = require('pidusage')
const child_process = require('child_process');

const { query, body, validationResult } = require('express-validator');


var uploadTaskQueue = [] // {file, cb}
var runningTasks = [] // {file, cb}
// var runningChildProcesses = []
var taskRunnerTimer = null

const addToTaskQueue = (file, cb) => {
    uploadTaskQueue.push({ file, cb })
    if (taskRunnerTimer == null) {
        taskRunner()
    }
}
const popItemFromTaskQueue = () => {
    var task = uploadTaskQueue.shift()
    return task
}


async function getChildrenRunningSize() {
    try {
        var taskPids = runningTasks.map(tsk => tsk.pid)
        var stats = []
        if (taskPids.length > 0) { stats = await pidusage(taskPids) }
        // console.log(stats[child.pid].memory/(1000*1000), stats[child2.pid].memory/(1000*1000))
        console.log("process priority", os.getPriority(process.pid))
        console.log("children priority", runningTasks.map(tsk => os.getPriority(tsk.pid)))
        return stats.reduce((curTotal, curStat) => curTotal += (curStat.memory / (1000 * 1000)), 0)
    } catch (err) {
        console.error("COULD NOT CALCULATE CHILDREN RUNNING SIZE", err)
        return 0
    }
}

var counter = 300
const taskRunner = async () => {
    // var runningSize = runningTasks.reduce(((curTotal, curTask) => curTotal += (curTask.file.size * 2)), 0)
    if (uploadTaskQueue[0]) {
        var childRunningSize = await getChildrenRunningSize() //MB
        // var nextFileSize = uploadTaskQueue[0].file.size * 2
        var pmu = process.memoryUsage()
        var pmuSum = (pmu.rss + pmu.heapTotal + pmu.external + pmu.arrayBuffers) / (1000 * 1000)
        var totalMemory = process.env.GAE_MEMORY_MB
        var freeMem = totalMemory - pmuSum - childRunningSize
        console.log("freeMem: ", freeMem, "MB")
        if (freeMem - 200 > 0) {
            transcodeFile(popItemFromTaskQueue())
        }
    }


    if (uploadTaskQueue.length > 0) {
        // console.log("process priority", os.getPriority(process.pid))
        // console.log("children priority", runningTasks.map(tsk => os.getPriority(tsk.pid)))
        taskRunnerTimer = setTimeout(taskRunner, 1000)
    } else {
        taskRunnerTimer = null
    }
}


function getDuration_MS_FromSTDERR(stderr) {
    //Get the timestamp from ffmpeg so we can store in database.
    //only really necessary if ffprobe is not on app engine.
    //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    var indexOfDuration = stderr.search("Duration"); if (indexOfDuration == -1) { console.error("DURATION NOT FOUND") }
    var endOfTimeIndex = stderr.indexOf(",", indexOfDuration); if (endOfTimeIndex == -1) { console.error("DURATION NOT FOUND") }
    var keyValue = stderr.slice(indexOfDuration, endOfTimeIndex)
    var timeStamp = keyValue.split(" ")[1]
    var hhmmss = timeStamp.split(":")
    var mins = parseFloat(hhmmss[1])
    var seconds = parseFloat(hhmmss[2])

    // console.log(timeStamp)
    var durationS;
    if (mins > 0) {
        durationS = 60
    } else {
        durationS = seconds
    }
    var durationMS = parseInt(durationS * 1000)
    if(!durationMS) {console.error("durationMS value false. Setting to 0 to protect db", durationMS); durationMS = 0}
    return durationMS
}


const transcodeFile = async (task) => {
    try {
        runningTasks.push(task)

        var tenMinsFromNow = new Date(+new Date() + (10 * 60 * 1000)).getTime()

        const config = {
            action: 'read',
            expires: tenMinsFromNow
        };

        try {
            var signedUrl = await cloudStorage.bucket(task.file.bucketName).file(task.file.fileName).getSignedUrl(config)
        } catch (err) {
            runningTasks.splice(runningTasks.indexOf(task), 1)
            return task.cb(err)
        }
        const input = signedUrl


        // const output = videoBlob.createWriteStream({resumable: false, contentType: 'video/mp4'});
        const outputFileName = "/tmp/" + uuidv4()
        // const outputFileStream = fs.createWriteStream('./compressed_videos/105Seconds.mp4')
        //TODO: Add preserve scale with padding
        var twoSixFour = "-y -t 60 -i " + input + " -s 540x960 -vcodec libx264 -preset slow -c:a aac -crf 26 -vf format=yuv420p -movflags +faststart -f mp4 " + outputFileName
        var parsedCommand = twoSixFour.split(' ')

        /*——————————————————————————————————————————————————*/
        /* VIDEO TRANSCODING */
        /*——————————————————————————————————————————————————*/
        var startTime = new Date()
        var ffmpeg = child_process.execFile('ffmpeg', parsedCommand, async function(err, stdout, stderr) {
            try {
                runningTasks.splice(runningTasks.indexOf(task), 1)
                if (err) { fs.unlink(outputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } }); return task.cb(err) }
                var endTime = new Date()
                console.log("Seconds To Transcode Video:", (endTime - startTime) / 1000)
                const transcodedVideoDuration = getDuration_MS_FromSTDERR(stderr)

                var videoBlob;
                var nameCollision = true
                while (nameCollision) {
                    if (videoBlob) { console.log("Collision") }
                    videoBlob = cloudStorage.bucket('swifty_videos').file(uuidv4()); // Create a new blob in the bucket and upload the file data.
                    nameCollision = await videoBlob.exists()[0]
                }

                /*——————————————————————————————————————————————————*/
                /* APNG THUMBNAIL TRANSCODING */
                /*——————————————————————————————————————————————————*/
                const thumbnailStartTimeSeconds = 0
                const apngOutputFile = "/tmp/" + uuidv4()
                var apngCommand = '-y -ss ' + thumbnailStartTimeSeconds + ' -i ' + outputFileName + ' -t 0.5 -f apng -plays 0 -vf fps=10,scale=100:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse ' + apngOutputFile
                var ffmpeg = child_process.execFile('ffmpeg', apngCommand.split(' '), async function(err, stdout, stderr) {
                    if (err) {
                        fs.unlink(outputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } });
                        fs.unlink(apngOutputFile, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } });
                        return task.cb(err)
                    }
                    var aPngBlob;
                    var pngNameCollision = true
                    while (pngNameCollision) {
                        if (aPngBlob) { console.log("Collision") }
                        aPngBlob = cloudStorage.bucket('swifty_animated_thumbnails').file(uuidv4()); // Create a new blob in the bucket and upload the file data.
                        pngNameCollision = await aPngBlob.exists()[0]
                    }

                    /*——————————————————————————————————————————————————*/
                    /* AUDIO TRANSCODING (copying from converted video) */
                    /*——————————————————————————————————————————————————*/
                    const audioOutputFilename = "/tmp/" + uuidv4()
                    var audioCommand = "-y -i " + outputFileName + " -vn -acodec copy -f mp4 " + audioOutputFilename

                    var ffmpeg = child_process.execFile('ffmpeg', audioCommand.split(' '), async function(err, stdout, stderr) {
                        if (err) {
                            fs.unlink(outputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } });
                            fs.unlink(apngOutputFile, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } });
                            fs.unlink(audioOutputFilename, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } });
                            return task.cb(err)
                        }
                        var audioBlob;
                        var audioNameCollision = true
                        while (audioNameCollision) {
                            if (audioBlob) { console.log("Collision – Audio") }
                            audioBlob = cloudStorage.bucket('swifty_soundtracks').file(uuidv4()); // Create a new blob in the bucket and upload the file data.
                            audioNameCollision = await audioBlob.exists()[0]
                        }



                        try {
                            //Upload Transcoded Video
                            await cloudStorage.bucket(task.file.bucketName).upload(outputFileName, { destination: videoBlob, metadata: { contentType: 'video/mp4' }, resumable: false });
                            fs.unlink(outputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })

                            //Upload APNG
                            await cloudStorage.bucket(task.file.bucketName).upload(apngOutputFile, { destination: aPngBlob, metadata: { contentType: 'image/apng' }, resumable: false });
                            fs.unlink(apngOutputFile, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } });

                            //Upload Audio
                            await cloudStorage.bucket(task.file.bucketName).upload(audioOutputFilename, { destination: audioBlob, metadata: { contentType: 'audio/mp4' }, resumable: false });
                            fs.unlink(audioOutputFilename, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } });
                        } catch (error) {
                            fs.unlink(outputFileName, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } })
                            fs.unlink(apngOutputFile, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } });
                            fs.unlink(audioOutputFilename, function(err) { if (err) { console.error("ERROR UNLINKING FILE", err) } });
                            return task.cb(error)
                        }
                        return task.cb(null,
                            {
                                videoFilename: videoBlob.name,
                                apngFilename: aPngBlob.name,
                                audioFilename: audioBlob.name,
                                videoMilliseconds: transcodedVideoDuration
                            })
                    })
                })
            } catch (error) {
                runningTasks.splice(runningTasks.indexOf(task), 1)
                return task.cb(error)
            }
        })


        // os.setPriority(ffmpeg.pid, 19)
        task.pid = ffmpeg.pid
        console.log("Past ffmpeg call")
    } catch (err) {
        return task.cb(err)
    }
}


function memoryInfo(req, res) {
    // {rss: 61898752, heapTotal: 12136448, heapUsed: 9395288, external: 1506102, arrayBuffers: 59562}
    var pmu = process.memoryUsage()
    var pmuSum = (pmu.rss + pmu.heapUsed + pmu.external + pmu.arrayBuffers) / (1000 * 1000)
    var memInfo = {
        "process.memoryUsage": pmuSum,
        "GAE_MEMORY_MB": process.env.GAE_MEMORY_MB,
        "RemainingMemory": process.env.GAE_MEMORY_MB - pmuSum
    }
    console.log("process priority", os.getPriority(process.pid))
    console.log("children priority", runningTasks.map(tsk => os.getPriority(tsk.pid)))
    res.json(memInfo)
}



var sql;

var uploadVideoSanitation = [
    // [...a, b]
    body('videoDescription')
    .trim()
    .isLength({ max: 150 })
    .escape(), 
    body('allowComments').isBoolean(), //true, false, 0, 1
    body('allowReactions').isBoolean() //true, false, 0, 1
]

function uploadVideo(req, res) {
    if (!req.file) { console.error("Not enough files"); return res.status(423).end() }
    const errors = validationResult(req) 
    if (!errors.isEmpty()) { console.log(errors); return res.status(400).send({ errors: errors.array() }) }

    const ALLOWCOMMENTS = req.body.allowComments
    const ALLOWREACTIONS = req.body.allowReactions
    const VIDEO_DESCRIPTION = req.body.videoDescription

    req.setTimeout(540000, function() {
        console.error("UploadVideo req Timeout")
        // Kill child process here?
        // Delete tmp files --> how do we identify?
        // Remove from ready/waiting queue
        // TODO: /*/*/*/*/*/*/*/*/*/
        return res.status(504).end()
    });
    // if ( !req.file.mimetype.includes("mov") ){ console.log("Not a photo"); return res.status(424).end(); }

    if (!req.session.user_id) { return res.status(401).end() }



    // const formData = req.body; //can strip inputs from here & then sanitize them
    // os.setPriority(process.pid, -20)
    addToTaskQueue(req.file, async function(err, uploadedData) {
        if (err) { console.error(err); return res.status(500).end() }

        try {
            await sql`       
                WITH inserted_soundtrack AS (
                    INSERT INTO soundtracks (
                        soundtrack_id,
                        soundtrack_filename,
                        duration_ms
                    ) VALUES (
                        ${uuidv4()},
                        ${uploadedData.audioFilename},
                        ${uploadedData.videoMilliseconds}
                    )
                    RETURNING soundtrack_id
                ), inserted_video AS (
                    INSERT INTO videos (
                        soundtrack_id,
                        video_id,
                        creator_id,
                        duration_ms,
                        apng_filename,
                        video_filename,
                        video_description,
                        allow_comments,
                        allow_reactions,
                        visibility
                    )   
                    SELECT 
                        inserted_soundtrack.soundtrack_id,
                        ${uuidv4()},
                        ${req.session.user_id},
                        ${uploadedData.videoMilliseconds},
                        ${uploadedData.apngFilename},
                        ${uploadedData.videoFilename},
                        ${VIDEO_DESCRIPTION}, 
                        ${ALLOWCOMMENTS},
                        ${ALLOWREACTIONS},
                        ${"public"}
                    FROM inserted_soundtrack
                RETURNING video_id, soundtrack_id
                )
                INSERT INTO soundtrack_source (soundtrack_id, creator_id, original_video)
                SELECT  
                    inserted_video.soundtrack_id,
                    ${req.session.user_id},
                    inserted_video.video_id
                FROM inserted_video
            `
            return res.status(200).end()
        } catch (err) {
            console.error(err)
            return res.status(500).end()
        }
    })
}



function passInDatabase(SQL) {
    sql = SQL
    return { uploadVideo, memoryInfo, uploadVideoSanitation }
}

module.exports = passInDatabase