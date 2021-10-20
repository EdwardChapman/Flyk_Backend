const { query, body, validationResult } = require('express-validator');


var sql; // This will be populated when module is required.


// const loginValidation = [
//     body('email').trim().isEmail().normalizeEmail().escape(),
//     body('password').not().isEmpty()
//     // body('password').isLength({ min: 8 }).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/).escape(), //dont need b/c hash?
// ]


async function getMyProfile(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }
    try {
        const [myProfile] = await sql`
            SELECT user_id, username, profile_img_filename, profile_bio 
            FROM users
            WHERE user_id = ${req.session.user_id}
            LIMIT 1
        `
        // IMPLEMENT: GET FOLLOWER AND FOLLOWEE COUNT & LIKES COUNT?

        //TODO: remove the part of json object that says "command & count"
        if (!myProfile) { return res.status(401).end() }
        res.status(200).json(myProfile)
    } catch (err) {
        res.status(400).end()
    }
}

async function getMyPosts(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }
    try {
        const myPosts = await sql`
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
                EXISTS(SELECT * FROM video_likes WHERE video_likes.user_id = ${req.session.user_id} AND video_likes.video_id = users_posts.video_id) AS is_liked_by_user
            FROM
                (
                    SELECT *
                    FROM videos
                    WHERE creator_id = ${req.session.user_id}
                    ORDER BY post_date
                ) as users_posts
            INNER JOIN users
            ON users_posts.creator_id = users.user_id
        `
        //TODO: DO A JOIN HERE TO GET THE USER DATA


        //TODO: remove the part of json object that says "command & count"
        res.status(200).json(myPosts)
    } catch (err) {
        res.status(400).end()
    }
}

async function getMyLikes(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }
    try {
        const myLikes = await sql`
        SELECT 
            creator_id as user_id, 
            videos.video_id, 
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
            ( SELECT COUNT(*) FROM video_likes WHERE video_likes.video_id = videos.video_id) as likes_count,
            ( SELECT COUNT(*) FROM comments WHERE comments.video_id = videos.video_id) as comments_count,
            EXISTS(SELECT * FROM follows WHERE follows.from_user_id = ${req.session.user_id ? req.session.user_id : null} AND follows.to_user_id = creator_id) AS is_followed_by_viewer,
            TRUE AS is_liked_by_user
        FROM
            (
                SELECT * FROM video_likes 
                WHERE user_id = ${req.session.user_id ? req.session.user_id : null}
            ) AS users_likes
            INNER JOIN videos
            ON users_likes.video_id = videos.video_id
            INNER JOIN users
            ON videos.creator_id = users.user_id
        ORDER BY like_date DESC
        `
        //^^ This get likes by id but not the actual video data...


        //TODO: DO A JOIN HERE TO GET THE VIDEO DATA


        //TODO: remove the part of json object that says "command & count"
        res.status(200).json(myLikes)

    } catch (err) {
        res.status(400).end()
    }
}


const updateMyProfileValidation = [
    body('username')
        .trim()
        .isLength({ min: 1, max: 30 }).withMessage('Username must be 1-30 characters long')
        .matches(/^[A-Za-z0-9._]+$/).withMessage('Username must only contain letters, numbers, underscores and periods'),

    body('bio')
        .trim()
        .isLength({ max: 150 }).withMessage('Bio must be less than 150 chacters')
        .escape() //TODO: BIO SANITATION REGEX
]


async function updateMyProfile(req, res) {
    if (!req.session.user_id) { return res.status(401).end() }

    const errors = validationResult(req)
    if (!errors.isEmpty()) { return res.status(400).json({errors: errors.array().map(({ msg }) => msg) }) }

    const USERNAME = req.body.username.toLowerCase()
    const BIO = req.body.bio

    //IMPLEMENT: Check here if username is taken...



    try {

        const [existingUsername] = await sql`
        SELECT user_id
        FROM users
        WHERE 
            username = ${USERNAME}
            AND
            user_id != ${req.session.user_id} 
        `
        if (existingUsername) { return res.status(409).end() }

        await sql`
            UPDATE users
            SET 
                username = ${USERNAME},
                profile_bio = ${BIO}
            WHERE user_id = ${req.session.user_id} 
        `
        return res.status(200).end()
    } catch (err) {
        return res.status(500).end()
    }
}




function passInDatabase(SQL) {
    sql = SQL
    return {
        getMyProfile,
        getMyLikes,
        getMyPosts,
        updateMyProfile, updateMyProfileValidation
    }
}

module.exports = passInDatabase