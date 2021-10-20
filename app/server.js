const GarbageCollector = require('./GarbageCollection'); //If servers crash b/c bad GC
const assert = require('assert');

const app = require('express')(); 
require('./ConfigServer')(app);

// const mongo = require('./mongoConnection')(app) // this will return a null variable but eventally have client

const sql = require('./postgresConnection');
app.use(require('./cookies')(sql));
const { cloudStorage } = require('./Shared');


//TODO: CHECK THAT ALL res.end()s have return statements before them. (otherwise it could fall through and have unintended consequences.)




/*
    401 : Unauthorized : The user must log in to do the action (like, comment, post)
    403 : FORBIDDEN : The user does not have access to that data (private account, ...)
*/

app.use('/', require('express').static('out', { redirect: true, extensions: ['html'] }));






/* Video Streaming */
const StreamVideos = require('./PathHandlers/StreamVideos');
// app.get('/list/', StreamVideos.listVideos); //This is for testing but will be removed
app.get('/video/:filename', StreamVideos.getVideoStream); //This is also for testing but will be reused


/* thumbnail/animated */
    //  / -> returns .apng file
const thumbnailPaths = require('./PathHandlers/Thumbnail')
app.get('/video/animatedThumbnail/:filename', thumbnailPaths.getAnimatedThumbnail);

/* profile photo */
    //  / -> returns jpeg
const getProfilePhotoPaths = require('./PathHandlers/profilePhoto')
app.get('/profile/photo/:filename', getProfilePhotoPaths.getProfilePhoto);


/* Create Account */
const CreateAccount = require('./PathHandlers/CreateAccount')(sql);
const createAccountValidation = CreateAccount.createAccountValidation ; assert.notEqual(null, createAccountValidation);
app.post('/createAccount', createAccountValidation, CreateAccount.createAccount);


/* Login/Logout */
const Log_in_out = require('./PathHandlers/Account')(sql);
const loginValidation = Log_in_out.loginValidation ; assert.notEqual(null, loginValidation);
app.post('/login/', loginValidation, Log_in_out.login);
app.post('/logout/', Log_in_out.logout);



/* home */
app.post('/home', require('./PathHandlers/Home')(sql));


/* user */
    //  / -> returns user info (join on users) (originally be a post but eventually a get ??)
    //  /follow -> follows user if possible
    //  /unfollow -> 
const userPaths = require('./PathHandlers/User')(sql)
app.post("/user", userPaths.getUserValidation, userPaths.getUser);
app.post("/user/follow", userPaths.followUserValidation, userPaths.followUser);
app.post("/user/unfollow", userPaths.unfollowUserValidation, userPaths.unfollowUser);
app.post("/user/posts", userPaths.getUsersPostsValidation, userPaths.getUsersPosts);



/* discover */ // -> returns list of videos
app.post('/discover', require('./PathHandlers/Discover')(sql));

/* Search */
const searchPaths = require('./PathHandlers/Search')(sql);
app.post('/search', searchPaths.getSearchResultsValidation, searchPaths.getSearchResults);


/* notifications */
    //  / -> returns list of notifications
app.post('/notifications', require('./PathHandlers/Notifications')(sql));




/* video */
const videoPaths = require('./PathHandlers/Video')(sql)
app.post('/video/like', videoPaths.likeVideoValidation, videoPaths.likeVideo);
app.post('/video/unlike', videoPaths.unlikeVideoValidation, videoPaths.unlikeVideo);
app.post('/video/report', videoPaths.reportVideoValidation, videoPaths.reportVideo); //IMPLEMENT the report path
app.post('/video/delete', videoPaths.deleteVideoValidation, videoPaths.deleteVideo);

/* comments */
const commentPaths = require('./PathHandlers/Comments')(sql)
app.post('/video/comments/like', commentPaths.likeCommentValidation, commentPaths.likeComment);
app.post('/video/comments/unlike', commentPaths.unlikeCommentValidation, commentPaths.unlikeComment);
app.post('/video/comments/post', commentPaths.postCommentValidation, commentPaths.postComment);
app.post('/video/comments/remove',  commentPaths.removeCommentValidation, commentPaths.removeComment); //IMPLEMENT
app.post('/video/comments', commentPaths.getCommentsValidation, commentPaths.getComments); // -> returns list of comments //IMPLEMENT




/* myProfile */
const myProfilePaths = require('./PathHandlers/MyProfile')(sql)
app.post('/myProfile', myProfilePaths.getMyProfile); //     -> returns profile info
app.post('/myProfile/posts', myProfilePaths.getMyPosts); // -> returns list of posts
app.post('/myProfile/likes', myProfilePaths.getMyLikes); // -> returns list of liked posts
app.post('/myProfile/update', myProfilePaths.updateMyProfileValidation, myProfilePaths.updateMyProfile); // -> change profile info 




/* sountracks */
//  sountracks/like
//  soundtracks/forVideo -> returns list of comments
// const soundtrackPaths = require('./PathHandlers/Soundtracks')(sql)
// app.post('/soundtracks/like', commentPaths.likeCommentValidation, commentPaths.likeComment); //IMPLEMENT
// app.post('/soundtracks/get', commentPaths.likeCommentValidation, commentPaths.likeComment); //IMPLEMENT





app.listen(process.env.PORT || 8080, () => console.log(`App listening on port ${process.env.PORT || 8080}!`));
