var sql; // This will be populated when module is required.



async function getDiscover(req, res){
    //IMPLEMENT: Need to check if user is tmp or signedIn
    try{
        const videos = await sql`
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
                EXISTS(SELECT * FROM video_likes WHERE video_likes.user_id = ${req.session.user_id?req.session.user_id:null} AND video_likes.video_id = videos.video_id) AS is_liked_by_user,
                EXISTS(SELECT * FROM follows WHERE follows.from_user_id = ${req.session.user_id?req.session.user_id:null} AND follows.to_user_id = creator_id) AS is_followed_by_viewer
            FROM 
                videos INNER JOIN users 
                ON videos.creator_id = users.user_id
        `
        //TODO: Choose which videos the user will see

        res.status(200).json(videos)
    }catch(err){
        res.status(500).end()
    }
}







function passInDatabase(SQL) {
    sql = SQL
    return getDiscover
}

module.exports = passInDatabase