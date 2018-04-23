import memorizer from './memorizer';

chrome.runtime.onMessage.addListener( (req, sender, sendResponse ) => {
  if( !req || req.type !== 'searchSuggestion' ) return;

  sendResponse({
    type: 'typedSuggestions',
    q: req.text,
    browserId: req.browserId,
    suggestions: memorizer.getSuggestions(req.text).map( r => {
      var textParts = r.url.split(req.text);
      textParts[0] = '';
      return {
        type: 'page',
        points: 2000,
        value: textParts.join(req.text),
        text: textParts,
        title: r.title.split(req.text)
      };
    })
  });

  if( req.text.length > 2 ){
    getHistorySuggestions( req.text, req.browserId, sender.tab.id );
    getWebSuggestions( req.text, req.browserId, sender.tab.id );
  }
});

var googleDomain, searchURL;

// Get google localized url
fetch('https:/google.com')
  .then( res => {
    var parser = document.createElement('a');
    parser.href = res.url;
    searchURL = `https://${parser.host}/complete/search?client=chrome-omni&gs_ri=chrome-ext-ansg&xssi=t&oit=1&cp=5&pgcl=1&gs_rn=42&q=`
  })
;

function getWebSuggestions( text, browserId, tabId ){
  return fetch( searchURL + encodeURIComponent(text) )
    .then( res => res.text() )
    .then( body => {
      if( body.indexOf(")]}'") === 0 ){
        body = body.slice(4);
      }

      var data = parseGoogleSuggestions( text, JSON.parse(body) );
      console.log( data );
      chrome.tabs.sendMessage( tabId, {
        type: 'webSuggestions',
        browserId: browserId,
        suggestions: data,
        q: text
      });
    })
  ;
}

function parseGoogleSuggestions( text, data ){
  var suggestions = [],
    max = Math.min( 5, data[1].length )
  ;

  for( let i = 0; i < max; i++ ){
    suggestions.push({
      type: data[4]['google:suggesttype'][i] === 'NAVIGATION' ? 'page' : 'search',
      text: data[1][i].split(text),
      title: data[2][i].split(text),
      points: data[4]['google:suggestrelevance'][i],
      value: data[2][i] || data[1][i]
    });
  }

  return suggestions;
}

const twoDays = 2 * 24 * 60 * 60 * 1000;
function getTimePoints( time ){
  var timePoints = Date.now() - time;
  if( timePoints > twoDays ){
    return 0;
  }
  return (twoDays - timePoints) / 100000000;
}

function sortSuggestions( a, b ){
  return a.points < b.points ? 1 : - 1;
}
function getHistorySuggestions( text, browserId, tabId ){
  return new Promise( resolve => {
    chrome.history.search({text}, results => {
      var suggestions = [];

      results.forEach( r => {
        var timePoints = getTimePoints( r.lastVisitTime );

        if( !timePoints && !r.typedCount ) return;

        var value = r.url.split('://')[1];
        if( value.indexOf(text) !== 0 ){
          value = value.replace(/^www\./i, '');
        }

        suggestions.push({
          type: 'page',
          points: (600 + timePoints + (r.typedCount*10) + (r.visitCount / 2)) * 2,
          title: r.title.split(text),
          text: value.split(text),
          value: value
        });
      });
      // return resolve( results );
      suggestions.sort( sortSuggestions );

      chrome.tabs.sendMessage( tabId, {
        type: 'historySuggestions',
        browserId: browserId,
        suggestions: suggestions.slice(0,6),
        q: text
      });
    })
  })
}
