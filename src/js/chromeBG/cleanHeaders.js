import multiTabs from './multiTabs';

// Clean iframe headers
chrome.webRequest.onHeadersReceived.addListener( res => {
  // Only for registered frames
  var frame = multiTabs.frames[res.frameId];
  if( !frame ) return;

  var headers = [];
  res.responseHeaders.forEach( h => {
    var name = h.name.toLowerCase(),
      value = h.value
    ;

    if( name == 'x-frame-options' )
      return; // console.log('Frame block bypassed');

    if( name == 'content-security-policy' ){
      value = h.value.replace(/frame-ancestors[^;]*/i, '');
      // console.log('Frame block bypassed')
    }

    headers.push({name: name, value: value});
  });

  return {responseHeaders: headers};
},{urls: ["<all_urls>"]}, ["blocking", "responseHeaders"]);
