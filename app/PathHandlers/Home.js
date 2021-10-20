var sql; // This will be populated when module is required.



async function getHomeVideoList(req, res){
    //IMPLEMENT: Need to check if user is tmp or signedIn
    

    `${req.session.user_id?req.session.user_id:null}` //THIS IS WHAT WE NEED TO PASS TO LIKE JOIN

    try{
        //  / -> returns list of videos (post)  --> video list will be an outter join with videos they have interacted with...
        /* THIS IS THE OLD QUERY...
        const videos = await sql`
            SELECT 
                creator_id, 
                username, 
                profile_bio,
                profile_img_filename,
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
                COUNT(video_likes.video_id) as likes_count,
                COUNT(comments.video_id) as comments_count,
                EXISTS(SELECT * FROM video_likes WHERE video_likes.user_id = ${req.session.user_id?req.session.user_id:null} AND video_likes.video_id = videos.video_id) AS is_liked_by_user
            FROM 
                videos INNER JOIN users 
                ON videos.creator_id = users.user_id
                LEFT JOIN video_likes
                ON videos.video_id = video_likes.video_id
                LEFT JOIN comments
                ON videos.video_id = comments.video_id
            GROUP BY videos.video_id, username, profile_img_filename, profile_bio, video_likes.video_id, comments.video_id
        `
        */
        const videos = await sql`
        SELECT 
            creator_id as user_id, 
            username, 
            profile_bio,
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
            profile_img_filename, 
            ( SELECT COUNT(*) FROM video_likes WHERE video_likes.video_id = videos.video_id) as likes_count,
            ( SELECT COUNT(*) FROM comments WHERE comments.video_id = videos.video_id) as comments_count,
            EXISTS(SELECT * FROM video_likes WHERE video_likes.user_id = ${req.session.user_id?req.session.user_id:null} AND video_likes.video_id = videos.video_id) AS is_liked_by_user,
            EXISTS(SELECT * FROM follows WHERE follows.from_user_id = ${req.session.user_id?req.session.user_id:null} AND follows.to_user_id = creator_id) AS is_followed_by_viewer
        FROM 
            videos INNER JOIN users 
            ON videos.creator_id = users.user_id
        `
        //TODO: Choose which videos the user will see
        //IMPLEMENT: Join on soundtracks...

        
        videos.rows = null // remove from object before sending to client
        videos.command = null // ^^ 
        res.status(200).json(videos)
    }catch(err){
        res.status(500).end()
    }
}







function passInDatabase(SQL) {
    sql = SQL
    return getHomeVideoList
}

module.exports = passInDatabase