const { query, body, validationResult } = require('express-validator');

var sql; // This will be populated when module is required.

const getUserValidation = [
    body('userId').not().isEmpty()
]

async function getUser(req, res) {
    // if (!req.session.user_id) { return res.status(401).end() }
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).send({ errors: errors.array() }) }

    const USER_ID = req.body.userId;

    try{
        const [user] = await sql`
            SELECT 
                user_id, 
                username, 
                profile_img_filename, 
                profile_bio,
                EXISTS(SELECT * FROM follows WHERE follows.from_user_id = ${req.session.user_id?req.session.user_id:null} AND follows.to_user_id = user_id) AS is_followed_by_viewer
            FROM users
            WHERE user_id = ${USER_ID}
            LIMIT 1
        `
        // IMPLEMENT: GET FOLLOWER AND FOLLOWEE COUNT & LIKES COUNT?

        //TODO: remove the part of json object that says "command & count"
        if (!user) { return res.status(404).end() }
        res.status(200).json(user)
    }catch(err){
        res.status(400).end()
    }
}


const getUsersPostsValidation = [
    body('userId').not().isEmpty()
]

async function getUsersPosts(req, res) {
    // if (!req.session.user_id) { return res.status(401).end() }
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).send({ errors: errors.array() }) }

    const USER_ID = req.body.userId;

    try{
        const posts = await sql`
        SELECT
            creator_id as user_id, 
            users_posts.video_id, 
            video_description, 
            duration_ms, 
            apng_filename, 
            video_filename, 
            soundtrack_id, 
            allow_comments, 
            allow_reactions, 
            visibility, 
            post_date,
            username, 
            profile_img_filename, 
            profile_bio,
            ( SELECT COUNT(*) FROM video_likes WHERE video_likes.video_id = users_posts.video_id) as likes_count,
            ( SELECT COUNT(*) FROM comments WHERE comments.video_id = users_posts.video_id) as comments_count,
            EXISTS(SELECT * FROM video_likes WHERE video_likes.user_id = ${req.session.user_id?req.session.user_id:null} AND video_likes.video_id = users_posts.video_id) AS is_liked_by_user
        FROM
            (
                SELECT *
                FROM videos
                WHERE creator_id = ${USER_ID}
                ORDER BY post_date
            ) as users_posts
        INNER JOIN users
        ON users_posts.creator_id = users.user_id
        `
        // IMPLEMENT: GET FOLLOWER AND FOLLOWEE COUNT & LIKES COUNT?

        //TODO: remove the part of json object that says "command & count"
        res.status(200).json(posts)
    }catch(err){
        res.status(400).end()
    }
}



const followUserValidation = [
    body('userId').not().isEmpty()
]

async function followUser(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).send({ errors: errors.array() }) }

    const USER_ID = req.body.userId;

    try{
        await sql`
            INSERT INTO follows (from_user_id, to_user_id)
            VALUES (
                ${req.session.user_id},
                ${USER_ID}
            )
            ON CONFLICT DO NOTHING
        `
        res.status(200).end()
    }catch(err){
        res.status(400).end()
    }
}




const unfollowUserValidation = [
    body('userId').not().isEmpty()
]

async function unfollowUser(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }
    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).send({ errors: errors.array() }) }

    const USER_ID = req.body.userId;

    try{
        await sql`
            DELETE FROM follows
            WHERE 
                from_user_id = ${req.session.user_id}
            AND
                to_user_id = ${USER_ID}
        `
        res.status(200).end()
    }catch(err){
        res.status(400).end()
    }
}


function passInDatabase(SQL) {
    sql = SQL
    return { 
        getUser, getUserValidation,
        followUser, followUserValidation,
        unfollowUser, unfollowUserValidation,
        getUsersPosts, getUsersPostsValidation
    }
}

module.exports = passInDatabase