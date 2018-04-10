import store from './store';
import resolver from 'utils/TileResolver';

var getBuilder;
store.on('tiles:start', gb => getBuilder = gb );

var pendingRegisters = {},
  historyRegister = {},
  currentTab
;

store.on('browser:register', (id, url, clbk ) => {
  pendingRegisters[ url ] = clbk;

  store.browsers[id] = {
    history: [url],
    historyIndex: -1,
    lastPropUrl: url,
    suggestions: []
  };

  return new Promise( resolve => {
    chrome.runtime.sendMessage({type: 'iframeRegister', url: url}, frameDetails => {
      currentTab = frameDetails.tabId;
      historyRegister[ frameDetails.frameId ] = id;
      delete pendingRegisters[ url ];
      resolve( frameDetails );
    });
  });
});

// Listen to history events to navigate
var opening = false;
chrome.runtime.onMessage.addListener( (msg,sender) => {
  if( !msg || !msg.type ) return;

  var type = msg.type;
  if( type === 'navigation' ){
    var browserId = historyRegister[ msg.details.frameId ];
    store.emit('browser:push', browserId, msg.details.url);
    store.emit('browser:navigate', browserId, msg.details.url);
  }
  else if( sender.tab && sender.tab.id === currentTab && !opening  ){
    opening = true;
    setTimeout( () => opening = false, 100 );

    if( type === 'tileClick' ){
      store.emit('browser:navigate', undefined, msg.url );
    }
    else if( type === 'tileOpen' ){
      store.emit('browser:navigate', undefined, '/' );
    }
  }
});

// Listen to open new tile
document.body.addEventListener('keydown', e => {
  console.log( e.which );
});


function getBrowser( browserId, url ){
  var browser = store.browsers[ browserId ];

  if(!browser)
    return console.warn( 'No browser for frame ' + browserId );

  if( browser.history[ browser.historyIndex ] === url ){
    return; // console.warn( 'Skip pushing the same address to the history ' + url );
  }

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

  console.log('History push', url);
  browser.status = 'LOADING';
  browser.historyIndex++;

  var h = browser.history.slice( 0, browser.historyIndex );
  h.push( url);
  browser.history = h;
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
