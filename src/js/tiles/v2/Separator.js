import React, { Component } from 'react';

class Separator extends Component {
  constructor(){
    super();

    this.omd = this.onMouseDown.bind( this );
  }

  render() {
    return (
      <div className={ "tseparator ts" + this.props.type }
        style={ this.props.style }
        onMouseDown={ this.omd } >
      </div>
    );
  }

  onMouseDown( e ){
    var dimension = this.props.type === 'v' ? 'pageX' : 'pageY';
    var tile = this.props.tile;
    var mm, mu, ticking, ev;

    this.props.onMoveStart( this.props.wrapper, tile, e[dimension] );
    window.addEventListener('mousemove', mm = e => {
      ev = e;
      if( ticking ) return;
      ticking = true;

      requestAnimationFrame( () => {
        this.props.onMove( tile, ev[dimension] );
        ticking = false;
      });
    });

    window.addEventListener('mouseup', mu = e => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      this.props.onMoveEnd( tile, e[dimension] );
    });
  }
}

export default Separator;
