import memorizer from './memorizer';
memorizer.init();


var navQueue = {};
var historyQueue = {};
chrome.webNavigation.onBeforeNavigate.addListener( details => {
  if( details.frameId === 0 ){
    navQueue[ details.tabId ] = details.url;
  }
});

chrome.webNavigation.onCommitted.addListener( details => {
  if( !navQueue[ details.tabId] ) return;
  var initialURL = navQueue[details.tabId];
  delete navQueue[details.tabId];

  if( details.transitionType !== 'typed' ) return;

  // memorizer.addHit( initialURL );
  console.log('HIT', initialURL);
  historyQueue[ details.url ] = initialURL;
});

chrome.history.onVisited.addListener( result => {
  var originalUrl = historyQueue[ result.url ];
  if( !originalUrl ) return;
  delete historyQueue[ result.url ];

  memorizer.addHit({
    title: result.title,
    url: originalUrl
  });

  console.log('Typed navigation', result);
});
