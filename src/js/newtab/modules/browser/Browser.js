import React, { Component } from 'react';
import Tiles from 'tiles/react-tiles';
import AddressBar from './AddressBar';
import store from 'state/store';


class Browser extends Component {
  constructor(props){
    super(props);
    var tile = props.layout;
    store.emit('browser:register', tile.id, tile.query.url);
    store.on('browser:reload', id => this.reloadIframe() );
    store.on('browser:stop', id => this.abortIframeLoad() )
  }

  render() {
    return (
      <iframe src={ this.props.layout.query.url }
        frameBorder="0"
        ref={ iframe => this.iframe = iframe}
        allowFullScreen={true}
        allow="geolocation *; microphone *; camera *; midi *; encrypted-media *"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms" />
    );
  }

  reloadIframe( browserId ){
    if( browserId !== this.props.layout.id ) return;
    console.log('Reload', browserId);
  }
  abortIframeLoad( browserId ){
    if( browserId !== this.props.layout.id ) return;
    console.log('Abort', browserId);
  }

  componentDidMount(){
    console.log('Mount');
    window.ifr = this.iframe;
    this.iframe.onload = () => {
      var b = store.browsers[ this.props.layout.id ];
      b.status = 'OK';
    };

    store.on('browser:reload', browserId => {
      console.log('RELOAD');
    });
  }
  componentDidUpdate( prevProps ){
    if( prevProps.layout.query.url !== this.props.layout.query.url ){
      this.iframe.focus();
    }
  }
}

function getBrowser( id ){
  return store.browsers[ id ];
}

Tiles.Tile.prototype.renderControls = function(){
  return (
    <AddressBar browser={ getBrowser( this.props.layout.id ) }
      closeTile={ () => this.closeTile() }
      url={ this.props.layout.query.url || "/" }
      browserId={ this.props.layout.id } />
  );
}


export default Browser;
