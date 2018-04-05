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
        reload = <Icon type="stop" />
      }
    }

    return (
      <div className={ cn }>
        <div className="abGrab"><Icon type="grab" /></div>
        <div className="abBack abBtn"><a onClick={ () => this.goBack() }><Icon type="arrow" /></a></div>
        <div className="abForward abBtn"><a onClick={ () => this.goForward() }><Icon type="arrow" /></a></div>
        <div className="abReload abBtn"><a onClick={ () => this.refresh() }>{ reload }</a></div>
        <Search onUrl={ url => this.navigate(url) } url={ this.props.url }/>
        <div className="abClose abBtn" onClick={ () => this.props.closeTile() }><a><Icon type="close" /></a></div>
        <Tiles.Link className="navLink" ref={ l => this.link = l } to={ browser && browser.history[browser.historyIndex]}></Tiles.Link>
      </div>
    );
  }

  push( url ){
    return this.navigate(url);

    var b = this.props.browser;
    b.historyIndex++;
    b.history.push(url);

    this.navigate(url);
  }

  navigate( url ){
    store.emit('browser:navigate', this.props.browserId, url );
  }

  goBack(){
    var b = this.props.browser;
    if( b.historyIndex < 1 ) return;

    b.historyIndex--;
    this.navigate( b.history[b.historyIndex] );
  }

  goForward(){
    var b = this.props.browser;
    if( b.historyIndex === b.history.length - 1 ) return;

    b.historyIndex++;
    this.navigate( b.history[b.historyIndex] );
  }
  refresh(){
    if( this.props.browser.status === 'LOADING' ){
      this.props.browser.emit('browser:stop', this.props.browserId);
    }
    else {
      this.props.browser.emit('browser:reload', this.props.browserId);
    }
  }
  componentNoWillReceiveProps( nextProps ){
    var browser = nextProps.browser;
    if( this.props.browser !== browser ){
      console.log('Browser update');
      var url = browser.history[ browser.historyIndex ];
      url && this.navigate(url);
      this.setState({
        url: url,
        propsUrl: nextProps.url
      });
    }
    else if( nextProps.url !== this.state.propsUrl ){
      this.setState({
        url: nextProps.url,
        propsUrl: nextProps.url
      });
    }
  }
}

export default AddressBar;
