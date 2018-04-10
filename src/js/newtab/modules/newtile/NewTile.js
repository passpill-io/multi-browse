import React, { Component } from 'react';
import Search from '../common/Search';
import Tiles from '../../../react-tiles/src/react-tiles';
import Clock from './Clock';
import Icon from 'modules/common/Icon';
import store from 'state/store';

var bgs = [
  {
    url: 'https://pixabay.com/get/e832b50829f7013ed1534705fb0938c9bd22ffd41cb3134693f6c970a3/busan-night-scene-1747130_1920.jpg',
    bg: '#0f266c',
    color: [255,255,255],
    author: 'Sungho Song',
    authorURL: 'https://pixabay.com/es/users/algrin25-3538884/?tab=latest'
  },
  {
    url: 'https://pixabay.com/get/ea37b3082ffd093ed1534705fb0938c9bd22ffd41cb313469cf0c37da2/nature-3227798_1920.jpg',
    bg: '#78793e',
    color: [253,211,14],
    author: 'Rüştü Bozkuş',
    authorURL: 'https://pixabay.com/es/users/kareni-5357143/'
  },
  {
    url: 'https://pixabay.com/get/ea35b80d2df1043ed1534705fb0938c9bd22ffd41cb313469cf2c778a1/nature-3092555_1920.jpg',
    bg: '#0b5cf2',
    color: [240,228,163],
    author: 'Johannes Plenio',
    authorURL: 'https://pixabay.com/es/users/jplenio-7645255/'
  }
];

class NewTile extends Component {
  constructor(){
    super();

    this.bg = bgs[ Math.floor( (Math.random() * bgs.length) - 0.000001 ) ];
    this.state = {
      bgLoaded: false
    }
  }

  render() {
    var cn = 'newtile';
    if( this.state.bgLoaded ){
      cn += ' bgloaded';
    }

    return (
      <div className={cn}>
        <style>
          .newtile {`{background: ${this.bg.bg}}`}
          .clock {`{color: rgb(${this.bg.color[0]}, ${this.bg.color[1]}, ${this.bg.color[2]})}`}
          .newtile .search input {`{border-color: rgba(${this.bg.color[0]}, ${this.bg.color[1]}, ${this.bg.color[2]}, .8)}`}
        </style>
        <div className="bgImg" style={{background: `url(${this.bg.url})`}}></div>
        <a className="closeLink" onClick={ () => store.emit('browser:close', this.props.layout.id) }>
          <Icon type="close" />
        </a>
        <div className="ntContent">
          <div className="ntUpper">
            <Clock />
            <Search browserId={ this.props.layout.id } ref={ s => this.s = s } />
          </div>
          <div className="ntLower"></div>
        </div>
      </div>
    );
  }

  loadBG(){
    var img = document.createElement('img');
    img.onload = () => this.setState({bgLoaded: true});
    img.src = this.bg.url;
  }

  componentDidMount(){
    this.loadBG();
    setTimeout( () => {
      this.s.focus()
    }, 100 );
  }
}

export default NewTile;
