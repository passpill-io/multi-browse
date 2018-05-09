import React from 'react';

const resizeKeys = ['n','e','s','w','nw','ne','se','sw'];

class Tile extends React.Component {
  constructor( props ){
    super(props);

    this.onMoveStart = this.onMoveStart.bind(this);
    this.onClick = () => { this.props.onClick(this.props.tid) };

    this.state = {
      moving: false
    };
  }
  state = {
    moving: false,
    docking: false
  }

  render(){
    var cn = 'rtile';
    if( this.props.floating ){
      cn += ' floating';
    }
    if( this.state.moving ){
      cn += ' moving';
    }
    if( this.state.docking ){
      cn += ' docking';
    }
    if( this.props.withPlaceholder ){
      cn += ' rttph';
    }
    return (
      <div className={ cn } style={ this.props.style } ref={ el => this.el = el } onMouseDown={ this.onClick }>
        <div className="rtheader" onMouseDown={ this.onMoveStart }>
          { this.renderTileHeader() }
        </div>
        <TileContent url={ this.props.url } />
        { this.renderResizers() }
      </div>
    );
  }

  renderTileHeader() {
    return this.props.tileHeader ? this.props.tileHeader() : this.renderDefaultHeader();
  }

  renderDefaultHeader(){
  }

  renderResizers(){
    if( !this.props.floating ){
      return;
    }

    var resizers = resizeKeys.map( k => (
      <div key={k}
        className={"trresizer-" + k}
        onMouseDown={ () => this.props.onResizeStart(k, this.props.tid) } />
    ));

    return (
      <div className="trResizers">
        { resizers }
      </div>
    );
  }

  onMoveStart( e ){

  	// Only left click and not a control
  	if( e.button || e.target.tagName.toLowerCase() == 'a' )
    	return;

    var moveStarted = false,
      start = {left: e.clientX, top: e.clientY },
      ticking = false,
      el = this.el,
      mm, mu, ev
    ;

    this.props.onMoveStart( this.props.tid, {
      left: el.offsetLeft, top: el.offsetTop,
      width: el.offsetWidth, height: el.offsetHeight
    });

    window.addEventListener('mousemove', mm = e => {
      ev = e;
      if( ticking ) return;
      ticking = true;

      requestAnimationFrame( () => {
        ticking = false;

        var left = ev.clientX - start.left,
          top = ev.clientY - start.top
        ;

        if( !moveStarted && Math.abs( left ) < 20 && Math.abs( top ) < 20 ) return;
        moveStarted = true;

        this.props.onMove( left, top, ev.clientX, ev.clientY );
      });
    });

    window.addEventListener('mouseup', mu = e => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);

      var left = moveStarted ? ev.clientX - start.left : 0,
        top = moveStarted ? ev.clientY - start.top : 0
      ;

      this.props.onMoveEnd( left, top );
      this.setState({ moving: false });
    });

    this.setState({ moving: true });
  }

  componentWillUpdate( nextProps ){
    if( this.props.floating && !nextProps.floating ){
      // This will keep the z-index while the docking animation is on
      this.setState({ docking: true } );
      setTimeout( () => this.setState({docking: false}), 300 );
    }
  }
};

class TileContent extends React.Component {
  render(){
    var C = this.props.component;

    if( C ){
      return <div className="rtcontent"><C /></div>;
    }

    return <iframe src={ this.props.url } sandbox="allow-same-origin allow-scripts allow-popups allow-forms"/>;
  }

  shouldComponentUpdate(){
    return !this.props.updating;
  }
}

export default Tile;
