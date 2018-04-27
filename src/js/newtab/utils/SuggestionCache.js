var cache = {
  cache: {},
  get( q, isBack ){
    var result = this.cache[ q ],
      items = []
    ;

    if( result ){
      items = result.suggestions.slice();
    }
    else {
      result = {};
    }

    if( q ){
      if( isBack ){
        items.unshift({
          type: 'search',
          text: ['',''],
          points: 3000,
          value: q
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
          points: 1000,
          value: q
        });
      }
    }

    return {
      q: q,
      complete: result.historySuggestions && result.webSuggestions && result.typedSuggestions,
      suggestions: items
    };
  },
  add( data ){
    var hit = this.cache[ data.q ];

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
    hit.suggestions = this.mergeSorted( hit.suggestions, data.suggestions, 5);
  },

  removeSuggestions( stored, type ){
    var i = stored.length;
    while( i-- > 0 ){
      if( stored[i].source === type ){
        stored.splice(i,1);
      }
    }
  },

  mergeSorted( a, b, length ){
    var merged = [],
      values = {},
      i = length,
      target
    ;

    while( length-- > 0 && (a.length || b.length) ){
      // clean used values
      while( a[0] && values[a[0].value] ){
        a.shift();
      }
      while( b[0] && values[b[0].value] ){
        b.shift();
      }

      if( a[0] || b[0] ){
        var target = !a[0] ? b : (!b[0] ? a : (b[0].points > a[0].points ? b : a) );
        values[ target[0].value ] = 1;
        merged.push( target.shift() );
      }
    }

    return merged;
  },

  sortByPoints( a, b ){
    return a.points > b.points ? -1 : 1;
  }
}


export default cache;
