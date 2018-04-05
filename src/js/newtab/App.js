import React, { Component } from 'react';
import Tiles from '../react-tiles/src/react-tiles';
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
  }

}

export default App;
