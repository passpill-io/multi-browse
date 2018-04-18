import React, { Component } from 'react';
import store from 'state/store';

class TopSites extends Component {
  state = {
    topSites: false,
    elements: 0
  }

  render() {
    if( !this.state.topSites ){
      return <div ref={ c => this.el = c } className="topSites none"></div>;
    }

    var sites = [];

    for( let i = 0; i < this.state.elements; i++ ){
      sites.push( this.renderSite(this.state.topSites[i]) );
    }
    return (
      <div ref={ c => this.el = c } className="topSites">
        { sites }
      </div>
    );
  }

  componentDidMount(){
    chrome.runtime.sendMessage({type:'topSites'}, topSites => {
      this.setState({topSites});
    });

    this.calculateElements();
  }

  componentDidUpdate(){
    this.calculateElements();
  }

  renderSite( s ) {
    var title = <span className="title">{s.title || s.url.split('://')[1]}</span>,
      favicon = s.favicon ? <img className="favicon" src={s.favicon} /> : <span className="noFavicon"></span>,
      image = s.image ? {backgroundImage: `url(${s.image})`} : null
    ;

    return (
      <div className="topSite" key={s.url} onClick={ () => this.navigate(s.url) }>
        <header>
          { favicon }
          { title }
        </header>
        <div className="capture" style={ image } />
      </div>
    )
  }
  calculateElements(){
    var elements = Math.floor( this.el.clientHeight / 120 );
    if( elements !== this.state.elements ){
      this.setState({elements});
    }
  }
  navigate( url ){
    store.emit('browser:navigate', this.props.browserId, url);
  }
}

export default TopSites;
