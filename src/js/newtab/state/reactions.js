import store from './store';
import resolver from 'utils/TileResolver';

var getBuilder;
store.on('tiles:start', gb => getBuilder = gb );

var currentTab;

store.on('browser:register', (id, url, clbk ) => {
  store.browsers[id] = {
    history: [url],
    historyIndex: -1,
    lastPropUrl: url,
    suggestions: []
  };

  return new Promise( resolve => {
    var msg = {
      type: 'iframeRegister',
      url: url,
      browserId: id
    };

    chrome.runtime.sendMessage(msg, frameDetails => {
      currentTab = frameDetails.tabId;
      resolve( frameDetails );
    });
  });
});

// Listen to history events to navigate
chrome.runtime.onMessage.addListener( (msg,sender) => {
  if( !msg || !msg.type ) return;

  var type = msg.type;
  if( type === 'navigation' ){
    store.emit('browser:push', msg.browserId, msg.details.url);
    store.emit('browser:navigate', msg.browserId, msg.details.url);
  }
  else if( sender.tab && sender.tab.id === currentTab  ){
    if( type === 'tileClick' ){
      store.emit('browser:navigate', undefined, msg.url );
    }
    else if( type === 'tileOpen' ){
      store.emit('browser:navigate', undefined, '/' );
    }
  }
});

function getBrowser( browserId ){
  var browser = store.browsers[ browserId ];

  if(!browser)
    return console.warn( 'No browser for frame ' + browserId );

  return browser;
}

store.on('browser:navigate', ( browserId, url ) => {
  var builder = getBuilder();
  var route = url === '/' ? '/' : '/browser?url=' + encodeURIComponent(url);
  var url = builder.setTile({route: route, tile: browserId});
  resolver.navigate(url);
});

store.on('browser:push', (browserId, url) => {
  var browser = getBrowser( browserId, url );
  if( !browser ) return;

  if( browser.history[ browser.historyIndex ] === url ){
    return; // console.warn( 'Skip pushing the same address to the history ' + url );
  }

  console.log('History push', url);
  browser.status = 'LOADING';
  browser.historyIndex++;

  var h = browser.history.slice( 0, browser.historyIndex );
  h.push( url);
  browser.history = h;
});

store.on('browser:stop', browserId => {
  var browser = getBrowser( browserId );
  if( !browser ) return;

  browser.status = 'OK';
  chrome.runtime.sendMessage({
    type: 'browserStopRequest',
    browserId: browserId
  });
});

store.on('browser:reload', browserId => {
  var browser = getBrowser( browserId );
  if( !browser ) return;

  browser.status = 'LOADING';
  chrome.runtime.sendMessage({
    type: 'browserReloadRequest',
    browserId: browserId
  });
});

store.on('browser:close', browserId => {
  var builder = getBuilder();
  var url = builder.remove( browserId );
  resolver.navigate( url );
});

store.on('search:getSuggestions', (browserId, text) => {
  var payload = {
    type: 'searchSuggestion',
    text: text,
    browserId: browserId
  };
  return new Promise( resolve => {
    chrome.runtime.sendMessage( payload, suggestions => {
      resolve( suggestions );
    })
  })
});

window.getSearch = function( text ){
  store.emit('search:getSuggestions', text )
    .then( suggestions => {
      console.log( 'Suggestions', suggestions );
    })
  ;
}
