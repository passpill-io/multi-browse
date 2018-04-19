import '../img/icon-128.png'
import '../img/icon-34.png'

import './chromeBG/searchSuggestions';
import './chromeBG/typedHistory';
import './chromeBG/topSites';
import './chromeBG/cleanHeaders';

import multiTabs from './chromeBG/multiTabs';

chrome.runtime.onMessage.addListener( (req, sender, sendResponse ) => {
  if( !req || !req.type ) return;

  if( req.type === 'iframeRegister' ){
    onIframeRegister( req, sendResponse );
  }
  else if( req.type === 'tileClick' ){
    onTileClick( sender.tab.id, req.url, req.hostUrl );
  }
  else if( req.type === 'tileOpen' ){
    onTileOpen( sender.tab.id, req.hostUrl );
  }
  else if( req.type === 'browserReloadRequest' ){
    onBrowserReloadRequest( sender.tab.id, req.browserId );
  }
  else if( req.type === 'browserStopRequest' ){
    onBrowserStopRequest( sender.tab.id, req.browserId );
  }
  else if( req.type === 'registerScript' ){
    onRegisterScript( sender, sendResponse );
  }

  return true;
});


window.pendingRegisters = {};
function onIframeRegister( req, clbk ){

  // normalize url
  var parser = document.createElement('a');
  parser.href = req.url;
  // console.log('Adding pending register', url, parser.href);
  pendingRegisters[ parser.href.toString() ] = {
    clbk: clbk,
    browserId: req.browserId
  };
}

chrome.webNavigation.onBeforeNavigate.addListener( details => {
  // console.log(details);
  if( details.parentFrameId === -1 && details.url === 'chrome://newtab/' ){
    return multiTabs.add( details.tabId );
  }

  if( !multiTabs.has(details.tabId) || details.url === "about:srcdoc" ){
    return console.log('before navigate filtered', details.tabId, details.url );
  }

  if( pendingRegisters[details.url] && details.parentFrameId === 0 ){
    var query = {tabId: details.tabId, frameId: details.frameId},
      registerData = pendingRegisters[details.url]
    ;

    delete pendingRegisters[details.url];

    registerData.clbk( query );
    multiTabs.registerFrame( details.tabId, details.frameId, registerData.browserId );
  }
  else {
    //console.log('No pending register', details.url);
  }

  // console.log('Nav started', details);
});

chrome.webNavigation.onCommitted.addListener(function(details){
  var frame = multiTabs.frames[details.frameId]
  if( !frame ) return;

  var payload = {
    type: 'navigation',
    details: details,
    browserId: frame.browserId
  }

  chrome.tabs.sendMessage(details.tabId, payload);
});

chrome.tabs.onCreated.addListener( tab => {
  if( tab.url === 'chrome://newtab/' ){
    multiTabs.add(tab.id);
  }
  else {
    // console.log('On created', tab.url);
  }
});

chrome.tabs.onUpdated.addListener( (id,tab) => {
  // console.log('Tab updated', tab);

  if( !multiTabs.has(id) && tab.url === 'chrome://newtab/' ){
    multiTabs.add(id);
  }
  else if( multiTabs.has(id) && tab.url && tab.url !== 'chrome://newtab/' && tab.url.indexOf(`chrome-extension://${chrome.runtime.id}`) !== 0 ){
    multiTabs.remove(id);
  }
});

chrome.tabs.onRemoved.addListener( (id,tab) => {
  if( multiTabs.has(id) ){
    multiTabs.remove(id);
  }
});


var tilesUrl = `chrome-extension://${chrome.runtime.id}/newtab.html#/?t=r:m{c:mc{mct:URL1},c:c11{side:URL2}}`;
function getTilerUrl( url1, url2 ){
  var url = tilesUrl
    .replace('URL1', encodeURIComponent(`/browser?url=${encodeURIComponent(url1)}`))
    .replace('URL2', encodeURIComponent(`/browser?url=${encodeURIComponent(url2)}`))
  ;
  return url;
}
function onTileClick( tabId, url, hostUrl ){
  if( !multiTabs.has(tabId) ){
    chrome.tabs.create({url: getTilerUrl( hostUrl, url)}, tab => {
      multiTabs.add(tab.id);
    });
  }
}
function onTileOpen( tabId, hostUrl ){
  if( !multiTabs.has(tabId) ){
    chrome.tabs.create({url: getTilerUrl( hostUrl, '/' )}, tab => {
      multiTabs.add(tab.id);
    });
  }
}

function onBrowserReloadRequest( tabId, browserId ){
  console.log('BROWSER RELOAD REQUEST', browserId);

  chrome.tabs.sendMessage(tabId, {
    type: 'browserReload',
    browserId: browserId
  });
}

function onBrowserStopRequest( tabId, browserId ){
  console.log('BROWSER STOP REQUEST', browserId);

  chrome.tabs.sendMessage(tabId, {
    type: 'browserStop',
    browserId: browserId
  });
}

function onRegisterScript( sender, sendResponse ){
  var frames = multiTabs.frames;
  if( frames[ sender.frameId ] ){
    sendResponse({browserId: frames[sender.frameId].browserId});
  }
}
