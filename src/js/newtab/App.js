import React, { Component } from 'react';
import Tiles from 'js/tiles/react-tiles';
import resolver from './utils/TileResolver';
import router from './router';
import store from 'state/store';

import './scss/all.scss';
import './state/reactions';

class App extends Component {
  render() {
    return (
      <Tiles resolver={resolver} ref={ tiles => this.tiles = tiles } />
    );
  }

  componentDidMount(){
    chrome.tabs.getCurrent( t => {
      this.tab = t;
      console.log(t);
    });

    router.start();
    router.onChange( () => {
      this.forceUpdate();
    });

    store.on('state', () =>{
      this.forceUpdate();
    });

    store.emit('tiles:start', this.tiles.getQueryBuilder.bind(this.tiles) );

    // Open a new title on alt+t
    document.addEventListener('keydown', e => {
      if( e.altKey && e.which === 84 ){
        store.emit('browser:navigate', undefined, '/' );
      }
    });
  }

}

export default App;
