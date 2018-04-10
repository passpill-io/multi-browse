var week = 7 * 24 * 60 * 60 * 1000,
  trieLevels = 4
;

export default {
  init: function(){
    this.history = this.loadHistory();
  },

  loadHistory: function(){
    var h = localStorage.getItem('historyTrie');
    if( h ){
      return JSON.parse(h);
    }
    else {
      return {
        byUrl: {},
        items: {},
        lastId: 0,
        trie: {}
      }
    }
  },

  saveHistory( h ){
    localStorage.setItem('historyTrie', JSON.stringify(h) );
  },

  addHit: function( visit ){
    // Get prefixes up to 4 characters
    var link = document.createElement('a'),
      prefixes = {},
      host
    ;

    link.href = visit.url;
    host = link.host;
    if( host.indexOf('www.') === 0 ){
      host = host.slice(4);
      prefixes = {'w': 1, 'ww': 1, 'www': 1, 'www.': 1};
    }

    for( let i = 1; i<trieLevels+1; i++ ){
      prefixes[ host.slice(0,i).toLowerCase() ] = 1;
    }

    // Get the item from the history
    var id = this.history.byUrl[visit.url],
      item = id && this.history.items[id]
    ;

    if( !item ){
      // If there is no item, create a new one
      item = visit;
      item.id = ++this.history.lastId;
      item.count = 0;

      // Add it to the history
      this.history.items[item.id] = item;
      this.history.byUrl[visit.url] = item.id;

      // And the trie
      Object.keys( prefixes ).forEach( prefix => {
        if( !this.history.trie[prefix] ){
          this.history.trie[prefix] = [];
        }
        this.history.trie[prefix].push( item.id );
      })
    }

    // Update count and date
    item.count++;
    item.lastVisitedAt = Date.now();

    // Rebuild trie's entries
    this.rebuildPrefixes( Object.keys( prefixes ), () => {
      // Store the history
      this.saveHistory( this.history );
    });
  },

  rebuildPrefixes: function( prefixes, clbk ){
    if( !prefixes.length ) return clbk();
    this.rebuildPrefix( prefixes.pop() );
    setTimeout( () => this.rebuildPrefixes(prefixes, clbk) );
  },

  sortPrefixEntries: function( aid, bid ){
    var a = this.history.items[aid],
      b = this.history.items[bid]
    ;

    if( a.count > b.count ){
      return -1;
    }
    else if( a.count < b.count ){
      return 1;
    }
    else if( a.lastVisitedAt > b.lastVisitedAt ){
      return -1;
    }
    return 1;
  },

  rebuildPrefix: function( prefix ){
    // Entries older than 2^l weeks can be deleted
    var expireLimit = Math.pow(2, prefix.length) * week,
      ids = this.history.trie[ prefix ]
    ;

    if( !ids ) return;

    var now = Date.now(),
      i = ids.length,
      deleteItem = prefix.length === trieLevels,
      item
    ;

    while( i-- > 0 ){
      item = this.history.items[ ids[i] ];
      if( item ){
        if( item.lastVisitedAt < now - expireLimit ){
          ids.splice(i,1);
          if( deleteItem ){
            delete this.byUrl[ item.url ];
            delete this.items[ item.id ];
          }
        }
      }
      else {
        ids.splice(i,1);
      }
    }

    ids.sort( this.sortPrefixEntries.bind(this) );
  },

  getSuggestions( text ){
    var prefix = text.slice(0,4).toLowerCase(),
      entries = this.history.trie[prefix],
      suggestions = [],
      i = 0,
      item, url
    ;

    if( !entries ) return suggestions;

    while( suggestions.length < 5 && i < entries.length ){
      item = this.history.items[ entries[i] ];
      url = item && item.url.split('//')[1].toLowerCase();
      if( url.startsWith(prefix) || url.startsWith('www.' + prefix) ){
        suggestions.push( item );
      }
      i++;
    }
    return suggestions;
  }
}
