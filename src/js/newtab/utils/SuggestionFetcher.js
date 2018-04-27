import cache from './SuggestionCache';

var listeners = {};
var fetcher = {
  onSuggestions( browserId, clbk ){
    listeners[browserId] = clbk;
  },
  removeListener( browserId ){
    delete listeners[ browserId ];
  },
  emit( browserId, data ){
    listeners[browserId] && listeners[browserId](data);
  },
  fetch( browserId, text, isBack ){
    var s = cache.get( text, isBack );
    if( s.complete ){
      return s;
    }

    var payload = {
      type: 'searchSuggestion',
      text: text,
      browserId: browserId
    };

    chrome.runtime.sendMessage( payload, suggestions => {
      cache.add( suggestions );
      this.emit( browserId, cache.get(text, isBack) );
    });

    return s;
  }
}

chrome.runtime.onMessage.addListener( msg => {
  if( !msg || (msg.type !== 'webSuggestions' && msg.type !== 'historySuggestions') ) return;

  // console.log('Sugestions received', msg);
  cache.add( msg );
  fetcher.emit( msg.browserId, cache.get(msg.q) );
});

export default fetcher;
