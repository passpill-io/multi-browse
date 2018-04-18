import React, { Component } from 'react';
import Search from '../common/Search';
import Tiles from '../../../react-tiles/src/react-tiles';
import Clock from './Clock';
import Icon from 'modules/common/Icon';
import store from 'state/store';
import TopSites from './TopSites';
import ImageFetcher from 'utils/ImageFetcher';

class NewTile extends Component {
  constructor(){
    super();

    this.loadBG();
    this.state = {
      bgLoaded: false
    }
  }

  render() {
    var cn = 'newtile',
      browserId = this.props.layout.id,
      styles = this.getStyles()
    ;

    if( this.state.bgLoaded ){
      cn += ' bgloaded';
    }

    return (
      <div className={cn}>
        { styles.tag }
        <div className="bgImg" style={ styles.img }></div>
        <a className="closeLink" onClick={ () => store.emit('browser:close', browserId) }>
          <Icon type="close" />
        </a>
        <div className="ntContent">
          <div className="leftSidebar">
            <TopSites browserId={ browserId } />
            <div className="bottom">
              { this.renderImageDescription() }
            </div>
          </div>
          <div className="ntMain">
            <div className="ntUpper">
              <Clock />
              <Search browserId={ browserId } ref={ s => this.s = s } />
            </div>
            <div className="ntLower">
            </div>
          </div>
        </div>
      </div>
    );
  }

  getStyles(){
    if( !this.state.bgLoaded ) return {};

    return {
      tag: (
        <style>
          .newtile {`{background: ${this.bg.bg}}`}
          .clock {`{color: rgb(${this.bg.color[0]}, ${this.bg.color[1]}, ${this.bg.color[2]})}`}
          .newtile .search input { `{border-color: ${this.getBorderColor()}}` }
        </style>
      ),
      img: {background: `url(${this.bg.url})`}
    };
  }

  getBorderColor(){
    var color = this.bg.color;
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, .8)`;
  }

  renderImageDescription(){
    var bg = this.bg;
    if(!bg){
      return <div className="imageDescription"></div>;
    }

    return (
      <div className="imageDescription" style={{borderColor: this.getBorderColor() }}>
        <p>Image by</p>
        <p>
          <a href={bg.authorURL}>
            { bg.author }
          </a>
        </p>
        <p>at <a href={ bg.host.url }>{ bg.host.name }</a></p>
      </div>
    );
  }

  loadBG(){
    // Fetch images json
    ImageFetcher.getJSON( data => {

      // A random background
      this.bg = data[ Math.floor( (Math.random() * data.length) - 0.000001 ) ];

      // Load the image
      var img = document.createElement('img');
      img.onload = () => this.setState({bgLoaded: true});
      img.src = this.bg.url;
    });
  }

  componentDidMount(){
    setTimeout( () => {
      this.s.focus()
    }, 100 );
  }
}

export default NewTile;
