const {multer, cloudStorage, uuidv4} = require('../Shared');
const bucket = cloudStorage.bucket("swifty_animated_thumbnails"); // Set Storage Bucket



async function getAnimatedThumbnail(req, res) {
  //TODO: Should we check if user has permission to see this...
  var filename = req.params.filename
  if (!filename) { return res.status(405).end() }

  var file = bucket.file(filename)
  if(!file){return res.status(404).end()}
  // try { // in theory this is better than just trying to stream the data... but the later is faster and will still return an error.
  //   await file.exists()
  // } catch(err) {
  //   return res.status(404).end()
  // }

  res.type('image/png'); //Eventually we might want to check the mimeType of the actual image but for now its just png
  res.set('Cache-Control', 'public, max-age=300, immutable'); //TODO: Decide if this is the cache control I want

  file.createReadStream()
    .on('error', function(err) {
      return res.status(500).end()
    })
    .on('end', function() {
      // The file is fully downloaded.
      return res.status(200).end()
    })
    .pipe(res);
}

module.exports = {getAnimatedThumbnail}
