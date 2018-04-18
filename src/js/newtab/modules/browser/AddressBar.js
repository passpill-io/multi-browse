import React, { Component } from 'react';
import Search from '../common/Search';
import Icon from 'modules/common/Icon';
import Tiles from 'tiles/react-tiles';

class AddressBar extends Component {
  constructor(props){
    super(props);
    this.state = {
      url: props.url,
      propsUrl: props.url
    };
  }

  render() {
    var browser = this.props.browser,
      cn = 'addressBar',
      reload = <Icon type="reload" />
    ;

    if(!browser){
      cn += ' noPast noFuture';
    }
    else {
      if( browser.historyIndex < 1 ){
        cn += ' noPast';
      }
      if( browser.historyIndex === browser.history.length - 1 ){
        cn += ' noFuture';
      }

      if( browser.status === 'LOADING' ){
        reload = (
          <div className="refreshIcons">
            <Icon type="loading" />
            <Icon type="stop" />
          </div>
        );
      }
    }

    return (
      <div className={ cn }>
        <div className="abGrab"><Icon type="grab" /></div>
        <div className="abBack abBtn"><a onClick={ () => this.goBack() }><Icon type="arrow" /></a></div>
        <div className="abForward abBtn"><a onClick={ () => this.goForward() }><Icon type="arrow" /></a></div>
        <div className="abReload abBtn"><a onClick={ () => this.refresh() }>{ reload }</a></div>
        <Search browserId={ this.props.browserId } url={ this.props.url }/>
        <div className="abClose abBtn" onClick={ () => this.props.closeTile() }><a><Icon type="close" /></a></div>
        <Tiles.Link className="navLink" ref={ l => this.link = l } to={ browser && browser.history[browser.historyIndex]}></Tiles.Link>
      </div>
    );
  }

  goBack(){
    var b = this.props.browser;
    if( b.historyIndex < 1 ) return;

    b.historyIndex--;
    b.emit('browser:navigate', this.props.browserId, b.history[b.historyIndex]);
  }

  goForward(){
    var b = this.props.browser;
    if( b.historyIndex === b.history.length - 1 ) return;

    b.historyIndex++;
    b.emit('browser:navigate', this.props.browserId, b.history[b.historyIndex]);
  }
  refresh(){
    if( this.props.browser.status === 'LOADING' ){
      this.props.browser.emit('browser:stop', this.props.browserId);
    }
    else {
      this.props.browser.emit('browser:reload', this.props.browserId);
    }
  }
}

export default AddressBar;
