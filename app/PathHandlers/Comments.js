const { query, body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { uuidv4 } = require('../Shared');
const saltRounds = 12; // SaltRounds for bcrypt ~12 is good for now... can increase later

var sql; // This will be populated when module is required.


const getCommentsValidation = [
    body('videoId').not().isEmpty({ ignore_whitespace: true })
]

async function getComments(req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }) }

    const VIDEO_ID = req.body.videoId;

    /* Fetch Account Provided Email (or none if DNE) */
    try {
        var commentsList = await sql`
            SELECT 
                comment_id, 
                comment_date, 
                comment_text, 
                username,
                users.user_id,
                profile_img_filename,
                ( SELECT COUNT(*) FROM comment_likes WHERE comment_likes.comment_id = comments_list.comment_id) as likes_count,
                EXISTS(SELECT * FROM comment_likes WHERE comment_likes.user_id = ${req.session.user_id?req.session.user_id:null} AND comment_likes.comment_id = comments_list.comment_id) AS is_liked_by_user
            FROM
                (
                    SELECT comment_id, user_id, comment_date, comment_text 
                    FROM comments 
                    WHERE video_id = ${VIDEO_ID}
                ) AS comments_list
            INNER JOIN users
            ON comments_list.user_id = users.user_id
        `
        //IMPLEMENT: JOIN ON USERS TO GET THEIR USERNAME & PROFILE IMG
        //TODO: add pagination here
        //TODO: remove the part of json object that says "command & count"
        res.status(200).json(commentsList)
    } catch (err) {
        console.error(err)
        return res.status(500).end()
    }
}

const postCommentValidation = [
    body('comment').trim().isLength({ min: 1, max: 250 }).escape(), //TODO: determine max length we are accepting
    body('videoId').not().isEmpty({ ignore_whitespace: true })
]

async function postComment(req, res) {
    //TODO: Check if user can post comment
    //then post it 
    if (!req.session.user_id) { return res.status(401).end() }
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }) }
    var VIDEOID = req.body.videoId
    var COMMENT_TEXT = req.body.comment
    try {
        await sql`
            INSERT INTO comments (comment_id, user_id, video_id, comment_text)
            VALUES (
                ${uuidv4()},
                ${req.session.user_id},
                ${VIDEOID},
                ${COMMENT_TEXT}
            )
        `
        //TODO: remove the part of json object that says "command & count"
        res.status(200).end()
    } catch (err) {
        console.error(err)
        return res.status(500).end()
    }
}

const removeCommentValidation = [
    body('commentId').not().isEmpty({ ignore_whitespace: true })
]

async function removeComment(req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }) }
    return res.status(501).end()
    //TODO: Check if user is allowed to remove comment
    // then remove it...
}


const likeCommentValidation = [
    body('commentId').not().isEmpty({ ignore_whitespace: true })
]
async function likeComment(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }
    
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }) }

    var COMMENT_ID = req.body.commentId
    try {
        sql`
            INSERT INTO comment_likes (comment_id, user_id)
            VALUES (
                ${COMMENT_ID},
                ${req.session.user_id}
            )
            ON CONFLICT DO NOTHING
        `
        res.status(200).end()
    } catch (err) {
        console.error(err)
        res.status(400).end()
    }
}

const unlikeCommentValidation = [
    body('commentId').not().isEmpty({ ignore_whitespace: true })
]

async function unlikeComment(req, res){
    if (!req.session.user_id) { return res.status(401).end() }
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).send({ errors: errors.array() }) }

    const COMMENT_ID = req.body.commentId;

    try{
        await sql`
            DELETE FROM comment_likes
            WHERE 
                user_id = ${req.session.user_id}
            AND
                comment_id = ${COMMENT_ID}
        `
        res.status(200).end()
    }catch(err){
        res.status(400).end()
    }
}



function passInDatabase(SQL) {
    sql = SQL
    return {
        likeComment, likeCommentValidation,
        postComment, postCommentValidation,
        removeComment, removeCommentValidation,
        getComments, getCommentsValidation,
        unlikeComment, unlikeCommentValidation
    }
}

module.exports = passInDatabase