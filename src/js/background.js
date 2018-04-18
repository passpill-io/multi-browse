import '../img/icon-128.png'
import '../img/icon-34.png'

import './chromeBG/searchSuggestions';
import './chromeBG/typedHistory';
import './chromeBG/topSites';

chrome.runtime.onMessage.addListener( (req, sender, sendResponse ) => {
  if( !req || !req.type ) return;

  if( req.type === 'iframeRegister' ){
    onIframeRegister( req.url, sendResponse );
  }
  else if( req.type === 'tileClick' ){
    onTileClick( sender.tab.id, req.url, req.hostUrl );
  }
  else if( req.type === 'tileOpen' ){
    onTileOpen( sender.tab.id, req.hostUrl );
  }

  return true;
});


window.pendingRegisters = {};
function onIframeRegister( url, clbk ){
  var parser = document.createElement('a');
  parser.href = url;
  // console.log('Adding pending register', url, parser.href);
  pendingRegisters[ parser.href.toString() ] = clbk;
}

// Clean iframe headers
chrome.webRequest.onHeadersReceived.addListener( res => {

  // Only for the extension
  // if( res.initiator !== `chrome-extension://${chrome.runtime.id}`) return;

  var headers = [];
  res.responseHeaders.forEach( h => {
    var name = h.name.toLowerCase(),
      value = h.value
    ;


    if( name == 'x-frame-options' )
      return; // console.log('Frame block bypassed');

    if( name == 'content-security-policy' ){
      value = h.value.replace(/frame-ancestors[^;]*;/i, '');
      // console.log('Frame block bypassed')
    }

    headers.push({name: name, value: value});
  });

  return {responseHeaders: headers};
},{urls: ["<all_urls>"]}, ["blocking", "responseHeaders"]);

window.registeredFrames = {};
window.splitTabs = {
  items: {},
  add: function( tabId ){
    this.items[tabId] = [];

    // console.log('Split tab added', tabId);
  },
  remove: function( tabId ){
    if( this.items[tabId] ){
      this.items[tabId].forEach( frameId => {
        delete registeredFrames[frameId];
      });
      delete this.items[tabId]
      // console.log('Split tab removed', tabId);
    }
  },
  has: function( tabId ){
    return !!this.items[tabId];
  },
  registerFrame: function( tabId, frameId ){
    if( !this.items[tabId] ){
      return; // console.log("Can't register frame in a non split tab.");
    }

    this.items[tabId].push( frameId );
    registeredFrames[ frameId ] = tabId;
    // console.log(`Frame ${frameId} registered in tab ${tabId}`);
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(function(details){
  // console.log(details);
  if( details.parentFrameId === -1 && details.url === 'chrome://newtab/' ){
    return splitTabs.add( details.tabId );
  }

  if( !splitTabs.has(details.tabId) || details.url === "about:srcdoc" ){
    return console.log('before navigate filtered', details.tabId, details.url );
  }

  if( pendingRegisters[details.url] && details.parentFrameId === 0 ){
    var query = {tabId: details.tabId, frameId: details.frameId};

    pendingRegisters[details.url]( query );
    delete pendingRegisters[details.url];
    splitTabs.registerFrame( details.tabId, details.frameId );
  }
  else {
    //console.log('No pending register', details.url);
  }

  // console.log('Nav started', details);
});

var injectQueue = {};
chrome.webNavigation.onCommitted.addListener(function(details){
  if( !registeredFrames[details.frameId] ) return;

  if( splitTabs.has(details.tabId) ){
    if( !injectQueue[details.tabId] ){
      injectQueue[details.tabId] = [];
    }
    injectQueue[details.tabId].push(details.frameId);
  }

  chrome.tabs.sendMessage( registeredFrames[details.frameId], {type: 'navigation', details: details} );
});

chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {
    if( changeInfo.status !== 'complete' || !injectQueue[tabId] || !injectQueue[tabId].length ) return;
    chrome.tabs.executeScript(tabId, {
      frameId: injectQueue[tabId].shift(),
      file: 'contentScript.bundle.js'
    });
  }
);


chrome.commands.onCommand.addListener(function(command) {
  // console.log('Command:', command);
});

chrome.tabs.onCreated.addListener( tab => {
  if( tab.url === 'chrome://newtab/' ){
    splitTabs.add(tab.id);
  }
  else {
    // console.log('On created', tab.url);
  }
});

chrome.tabs.onUpdated.addListener( (id,tab) => {
  // console.log('Tab updated', tab);

  if( !splitTabs.has(id) && tab.url === 'chrome://newtab/' ){
    splitTabs.add(id);
  }
  else if( splitTabs.has(id) && tab.url && tab.url !== 'chrome://newtab/' && tab.url.indexOf(`chrome-extension://${chrome.runtime.id}`) !== 0 ){
    splitTabs.remove(id);
  }
});

chrome.tabs.onRemoved.addListener( (id,tab) => {
  if( splitTabs.has(id) ){
    splitTabs.remove(id);
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
  if( !splitTabs.has(tabId) ){
    chrome.tabs.create({url: getTilerUrl( hostUrl, url)}, tab => {
      splitTabs.add(tab.id);
    });
  }
}
function onTileOpen( tabId, hostUrl ){
  if( !splitTabs.has(tabId) ){
    chrome.tabs.create({url: getTilerUrl( hostUrl, '/' )}, tab => {
      splitTabs.add(tab.id);
    });
  }
}
