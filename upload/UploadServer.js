const app = require('express')(); 
require('./ConfigServer')(app)

const sql = require('./postgresConnection')
app.use(require('./cookies')(sql))

const {multer, multerMEM} = require('./Shared')
// const GarbageCollector = require('./GarbageCollection') 



const videoUpload = require('./uploadPaths/videoUpload')(sql) //TODO: I NEED TO TEST TO MAKE SURE THAT THIS SANITIZES WHEN ADDED AFTER MULTER
//BUG: If content type is not defined for every field, multer will hang.... This could be a devastating attack if it blocks 
app.post('/upload/', [multer.single('video'), ...videoUpload.uploadVideoSanitation], videoUpload.uploadVideo)
// app.get('/memory/', FileHandling.memoryInfo)

const profileImgUpload = require('./uploadPaths/profileImgUpload')(sql)
app.post('/upload/profilePhoto', multerMEM.single('profilePhoto'), profileImgUpload.uploadProfileImage)



app.listen(process.env.PORT || 8080, () => console.log(`App listening on port ${process.env.PORT || 8080}!`));
