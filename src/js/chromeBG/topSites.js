import hub from './hub';

var topSites = [],
  lastUpdated = {}
;

chrome.runtime.onMessage.addListener( (req, sender, sendResponse) => {
  if( req.type !== 'topSites' ) return;
  sendResponse(topSites);
});

const twoDays = 2 * 24 * 60 * 60 * 1000;
hub.on('url:visited', (tabId, url) => {
  if( !lastUpdated[url] || Date.now() - lastUpdated[url] < twoDays ) return;

  setTimeout( () => {
    captureImages( tabId, (image, favicon) => {
      if( !image ) return;
      updateImages( url, image, favicon );
      saveImages();
    });
  }, 3000);
});

function captureImages( tabId, clbk ){
  chrome.tabs.get( tabId, tab => {
    if( !tab || !tab.active ) return clbk();

    chrome.tabs.captureVisibleTab( undefined, undefined, capture => {
      getImageData( capture, image => {
        getImageData( tab.favIconUrl, favicon => {
          clbk( image, favicon );
        })
      })
    })
  })
}

const MAX = {
  width: 240,
  height: 140
};

function getImageData( url, clbk ){
  var image = new Image(),
    canvas = document.createElement("canvas"),
    canvasContext = canvas.getContext("2d")
  ;

  image.onload = function(){
    var factor;

    if(image.width / image.height < MAX.width / MAX.height)
      factor = image.width / MAX.width;
    else
      factor = image.height / MAX.height;

    if( factor < 1 ){
      factor = 1;
    }

    canvas.width = image.width / factor;
    canvas.height = image.height / factor;
    canvasContext.drawImage(image, 0, 0, image.width / factor, image.height / factor);
    clbk( canvas.toDataURL() );
  }

  image.src = url;
}

function updateImages( url, image, favicon ){
  topSites.forEach( site => {
    if( site.url !== url ) return;
    site.image = image;
    site.favicon = favicon;
    lastUpdated[url] = Date.now();
  });
}

const LS_KEY = 'topSitesImages';

function init( sites ){
  var images = getImages();
  sites.forEach( site => {
    if( images[site.url] ){
      site.favicon = images[site.url].favicon;
      site.image = images[site.url].image;
      lastUpdated[site.url] = images[site.url].lastUpdated;
    }
    else {
      lastUpdated[site.url] = 1;
    }
  });
  topSites = sites;
}

function getImages(){
  var images = localStorage.getItem(LS_KEY) ;
  return images ? JSON.parse(images) : {};
}

function saveImages(){
  var images = {};
  topSites.forEach( site => {
    images[ site.url ] = {
      favicon: site.favicon,
      image: site.image,
      lastUpdated: lastUpdated[site.url]
    };
  });
  localStorage.setItem(LS_KEY, JSON.stringify(images));
}

chrome.topSites.get( init );
