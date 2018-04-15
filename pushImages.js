var rimraf = require('rimraf');
var fs = require('fs-extra');
var s3 = require('s3');
var aws = require('aws-sdk');

const IMAGE_PATH = __dirname + '/images';
const UPLOAD_PATH = IMAGE_PATH + '/upload';
const PUBLIC_URL = 'http://multi-browse.s3-website.us-east-2.amazonaws.com/';

const IMAGE_COUNT = 4;

var imagesDir = readDir( UPLOAD_PATH );
if( !checkImages(imagesDir) ){
  exit(`Needs to be ${IMAGE_COUNT} images`);
}

var imageData = require( IMAGE_PATH + '/images.json' );
if( !checkImageData(imagesDir, imageData) ){
  exit("Image data doesn't match images in the folder");
}

var folderName = createFolderName();
delIfExists(folderName);
generateImagesFolder(folderName, imageData );
generateImagesJSON(imageData);

uploadDir(folderName, () => {
  uploadFile(`${IMAGE_PATH}/upload.json`, () => {
    console.log('Images uploaded ok');
  });
});




/* HELPER FUNCTIONS */

var fs = require('fs');

function exit( msg ){
  console.log('EXIT by ERROR: ' + msg );
  process.exit();
}
function readDir( path ){
  return fs.readdirSync( path );
}

function isImage( f ){
  return f.endsWith('.jpg') || f.endsWith('.jpeg');
}

function createFolderName(){
  var d = new Date();
  return `${d.getFullYear()}_${d.getMonth()+1}_${d.getDate()}_${d.getHours()}_${d.getMinutes()}`;
}

function checkImages( files ){
  var count = 0;
  files.forEach( f => {
    if( isImage(f) ){
      count++;
    }
  });
  return count === IMAGE_COUNT;
}

function checkImageData( files, data ){
  if( !data.splice ) return console.log('Image data is not an array');
  if( data.length !== IMAGE_COUNT ) return console.log(`Image data contains ${data.length} elements`);

  var fileNames = {};
  files.forEach( f => {
    if( isImage(f) )
      fileNames[f] = 1;
  });

  var used = {};
  for( let i in data ){
    if( !fileNames[ data[i].url ] ) return console.log(`${data[i].url} does not exist in upload folder`);
    if( used[ data[i].url ] ) return console.log(`${data[i].url} is repeated in the image data`);
    used[ data[i].url ] = 1;
  }

  return true;
}

function delIfExists( folder ){
  console.log('Cleaning dir' + folder );
  try {
    rimraf.sync( IMAGE_PATH + '/' + folder );
    console.log(`Dir ${folder} deleted`);
  }
  catch( err ){
    console.log('No dir to delete');
  }
}

function generateImagesFolder( folderName, imageData ){
  var imgPath = `${IMAGE_PATH}/${folderName}`,
    remoteFolder = `${PUBLIC_URL}${folderName}/`
  ;

  // create folder
  fs.mkdirSync( imgPath );

  // copy files
  imageData.forEach( d => {
    fs.copySync( `${UPLOAD_PATH}/${d.url}`, `${imgPath}/${d.url}` );
    d.url = remoteFolder + d.url;
  });
}

function generateImagesJSON( imageData ){
  // The data has been already adapted by generateImagesFolder
  fs.writeFileSync(`${IMAGE_PATH}/upload.json`, JSON.stringify(imageData) );
}

function createS3Client(){
  var s3Client = new aws.S3(
    require('./images/s3.json').s3Options
  );
  return s3.createClient({s3Client});
}

function uploadDir( folderName, clbk ){
  var options = require('./images/s3.json'),
    uploader = createS3Client().uploadDir({
      localDir: `${IMAGE_PATH}/${folderName}`,
      s3Params: {
        Bucket: options.bucket,
        Prefix: folderName,
        CacheControl: 'max-age:31536000' // 1 year
      }
    })
  ;

  console.log('Start uploading images dir');
  handleS3Progress( uploader, err => {
    if( err ){
      console.log(err);
      exit('Error uploading images dir');
    }
    clbk();
  });
}

function uploadFile( path, clbk ){
  var options = require('./images/s3.json'),
    pathParts = path.split('/'),
    uploader = createS3Client().uploadFile({
      localFile: path,
      s3Params: {
        Bucket: options.bucket,
        Key: "images.json",
        CacheControl: 'max-age:' + (24 * 60 * 60) // 1 day
      }
    })
  ;

  console.log('Start uploading images.json');
  handleS3Progress( uploader, err => {
    if( err && !err.ETag ){
      console.log(err);
      exit('Error uploading images.json');
    }
    clbk();
  });
}

function handleS3Progress( uploader, clbk ){
  uploader.on('error', clbk);
  uploader.on('progress', function() {
    console.log("progress", uploader.progressAmount, uploader.progressTotal);
  });
  uploader.on('end', clbk);
}
