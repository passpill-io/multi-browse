import memorizer from './memorizer';

chrome.runtime.onMessage.addListener( (req, sender, sendResponse ) => {
  if( !req || req.type !== 'searchSuggestion' ) return;

  sendResponse({
    q: req.text,
    suggestions: memorizer.getSuggestions(req.text).map( r => {
      r.points = 1000;
      r.type = 'history';
      return r;
    })
  });

  if( req.text.length > 2 ){
    getSearchSuggestions();
  }
});

var googleDomain, searchURL;

fetch('https:/google.com')
  .then( res => {
    var parser = document.createElement('a');
    parser.href = res.url;
    searchURL = `https://${parser.host}/complete/search?client=chrome-omni&gs_ri=chrome-ext-ansg&xssi=t&oit=1&cp=5&pgcl=1&gs_rn=42&q=`
  })
;

function joinSuggestions( history, web ){
  if( !web ) {
    return history || [];
  }
  else if( !history ){
    return web || [];
  }

  var suggestions = [];

  for( let i=0; i<6; i++ ){
    if( !history.length || history[0].points < web[0].points ){
      suggestions.push( web.shift() );
    }
    else {
      suggestions.push( history.shift() );
    }
  }

  return suggestions;
}

function getSearchSuggestions( text ){
  var suggestions = [],
    history, web, sent
  ;

  return new Promise( resolve => {
    var timer = setTimeout( () => {
      !sent && resolve( {q: text, suggestions: joinSuggestions(history, web)} );
    }, 1000);

    var checkFinished = function(){
      if( history && web ){
        clearTimeout( timer );
        sent === true;
        resolve( {q: text, suggestions: joinSuggestions(history, web)} );
      }
    }

    getHistorySuggestions( text ).then( s => (history = s) && checkFinished() );
    getWebSuggestions( text ).then( s => (web = s) && checkFinished() );
  });
}

function getWebSuggestions( text ){
  return fetch( searchURL + encodeURIComponent(text) )
    .then( res => res.text() )
    .then( body => {
      if( body.indexOf(")]}'") === 0 ){
        body = body.slice(4);
      }

      var data = parseGoogleSuggestions( JSON.parse(body) );
      console.log( data );
      return data;
    })
  ;
}

function parseGoogleSuggestions( data ){
  var suggestions = [];

  for( let i = 0; i < 6; i++ ){
    suggestions.push({
      type: 'search',
      text: data[1][i],
      title: data[2][i],
      points: data[4]['google:suggestrelevance'][i],
      url: data[4]['google:suggesttype'][i] === 'NAVIGATION' && data[2][i]
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
function getHistorySuggestions( text ){
  return new Promise( resolve => {
    chrome.history.search({text}, results => {
      var suggestions = [];

      results.forEach( r => {
        var timePoints = getTimePoints( r.lastVisitTime );

        if( !timePoints && !r.typedCount ) return;

        suggestions.push({
          type: 'history',
          points: 600 + timePoints + (r.typedCount*10) + (r.visitCount / 2),
          title: r.title,
          url: r.url
        });
      });
      // return resolve( results );
      suggestions.sort( sortSuggestions );
      resolve(suggestions.slice(0,6));
    })
  })
}
