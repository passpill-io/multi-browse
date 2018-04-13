const IMAGE_PATH = __dirname + '/images';
const UPLOAD_PATH = IMAGE_PATH + '/upload';
const PUBLIC_URL = 'https://dont.know/dir/';

const IMAGE_COUNT = 4;

var imagesDir = readDir( UPLOAD_PATH );
if( !checkImages(imagesDir) ){
  exit(`Needs to be ${IMAGE_COUNT} images`);
}

var imageData = require( UPLOAD_PATH + '/imageData.json' );
if( !checkImageData(imagesDir, imageData) ){
  exit("Image data doesn't match images in the folder");
}

var folderName = createFolderName();
delIfExists(folderName);
generateImagesFolder( IMAGE_PATH, folderName, UPLOAD_PATH, imageData );
generateImagesJSON(folderName);

uploadDir(folderName);
uploadFile(`${IMAGE_PATH}/images.json`);
console.log('Images uploaded ok');

/* HELPER FUNCTIONS */

var fs = require('fs');

function exit( msg ){
  console.log('EXIT by ERROR: ' + msg );
  process.exit();
}
function readDir( path ){
  return fs.readDirSync( path );
}

function isImage( file ){
  return f.endsWith('.jpg') || f.endsWith('.jpeg');
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

  var fileNames = {}
  files.forEach( f => {
    if( isImage[f] )
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


var s3 = require('s3');



var client = s3.createClient({
  s3Options: require('./images/s3.json')
});

var uploader = client.uploadDir({
  localDir: 'images/upload',

})
