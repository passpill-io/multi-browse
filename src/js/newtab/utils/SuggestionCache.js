export default {
  cache: {},
  get( q, isBack ){
    var result = this.cache[ q ];
    if( !result ) return false;
    var items = result.suggestions.slice();

    if( isBack ){
      items.unshift({
        type: 'search',
        text: ['',''],
        points: 3000
      });
    }
    else {
      var i = 0;
      while( items[i] && items[i].points > 1000 ){
        i++;
      }
      items.splice(i, 0, {
        type: 'search',
        text: ['',''],
        points: 1000
      });
    }

    return {
      complete: result.historySuggestions && result.webSuggestions && result.typedSuggestions,
      suggestions: items
    };
  },
  add( data ){
    var hit = this.cache[ data.q ]
    if( !hit ){
      this.cache[ data.q ] = hit = {
        historySuggestions: false,
        webSuggestions: false,
        typedSuggestions: false,
        suggestions: []
      };
    }

    if( hit[data.type] ){
      this.removeSuggestions( hit.suggestions, data.type );
    }

    hit[ data.type ] = true;
    hit.suggestions = this.mergeSuggestions( hit.suggestions, data );
  },

  removeSuggestions( stored, type ){
    var i = stored.length;
    while( i-- > 0 ){
      if( stored[i].source === type ){
        stored.splice(i,1);
      }
    }
  },

  mergeSuggestions( stored, data ){
    data.suggestions.forEach( s => {
      s.source = data.type;
      stored.push(s);
    });

    stored.sort( this.sortByPoints );

    return stored.slice(0,5);
  },

  sortByPoints( a, b ){
    return a.points > b.points ? -1 : 1;
  }
}
