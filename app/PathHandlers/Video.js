const { query, body, validationResult } = require('express-validator');

var sql; // This will be populated when module is required.

const likeVideoValidation = [
    body('videoId').not().isEmpty()
]

async function likeVideo(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).send({ errors: errors.array() }) }

    const VIDEO_ID = req.body.videoId;

    try{
        await sql`
            INSERT INTO video_likes (user_id, video_id)
            VALUES (
                ${req.session.user_id},
                ${VIDEO_ID}
            )
            ON CONFLICT DO NOTHING
        `
        return res.status(200).end()
    }catch(err){
        return res.status(400).end()
    }
}




const unlikeVideoValidation = [
    body('videoId').not().isEmpty()
]

async function unlikeVideo(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }
    const errors = validationResult(req)
    if (!errors.isEmpty()) { console.log(errors.array()) ; return res.status(400).send({ errors: errors.array() }) }

    const VIDEO_ID = req.body.videoId;

    try{
        await sql`
            DELETE FROM video_likes
            WHERE 
                user_id = ${req.session.user_id}
            AND
                video_id = ${VIDEO_ID}
        `
        return res.status(200).end()
    }catch(err){
        console.log(err)
        return res.status(400).end()
    }
}





const reportVideoValidation = [
    body('videoId').not().isEmpty()
]

async function reportVideo(req, res){
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).send({ errors: errors.array() }) }
    
    //IMPLEMENT: This needs to be able to do reports even if user isn't logged in .... maybe?
    return res.status(501).end()
}


const deleteVideoValidation = [
    body('videoId').not().isEmpty()
]
async function deleteVideo(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).send({ errors: errors.array() }) }


    const VIDEO_ID = req.body.videoId;
    try{
        await sql`
            DELETE FROM videos
            WHERE 
                creator_id = ${req.session.user_id}
            AND
                video_id = ${VIDEO_ID}
        `
        return res.status(200).end()
    }catch(err){
        return res.status(400).end()
    }

}


function passInDatabase(SQL) {
    sql = SQL
    return { 
        likeVideo, likeVideoValidation,
        unlikeVideo, unlikeVideoValidation,
        reportVideo, reportVideoValidation,
        deleteVideo, deleteVideoValidation
    }
}

module.exports = passInDatabase