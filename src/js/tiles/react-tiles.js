import React from 'react';
import TileWrapper from './components/TileWrapper';
import FloatingWrapper from './components/FloatingWrapper';
import ContextQueryBuilder from './utils/ContextQueryBuilder';
import TileLink from './components/TileLink';
import Tile from './components/Tile';
import QueryBuilder from './utils/QueryBuilder';
import utils from './utils/TileUtils';
import UrlParser from './utils/UrlParser';
import assign from 'object-assign';
import qs from 'qs';

require('./tiles.scss');
require('./utils/requestAnimationFrame');

var minSizes = {
  column: 200, // For column wrappers this is the minimun height of a row
  row: 320 // For row wrappers this is the minumum width of a column
};

class Tiles extends React.Component {
  constructor(props){
    super(props);
    Tiles.getQueryBuilder = this.getQueryBuilder.bind(this);

    Tiles.getWrapperInfo = id => {
      return this.getQueryBuilder().getWrapperInfo( id );
    }

    // this.setPathFormat();

    this.props.resolver.init( this.props );
    Tiles.resolver = this.props.resolver;

    // Bind some quick methods
    this.onMoveStart = this.onMoveStart.bind(this);
    this.onResizeStart = this.onResizeStart.bind(this);
    this.onMoveStop = this.onMoveStop.bind(this);

    var layout = UrlParser.parse( this.getRoute() );
    ContextQueryBuilder.update(layout);
    
    this.state = {
      layout: layout,
      floatingBoxes: this.getInitialBoxes( layout ),
      currentLocation: location.href,
      dimensions: {
        height: window.innerHeight,
        width: window.innerWidth
      },
      resizing: false,
      moving: false
    };
  }

  render(){
    var className = 'tilecontainer';
    if( this.state.resizing ){
      className += ' tileresizing';
    }
    if( this.state.moving ){
      className += ' tilemoving';
    }

    return (
      <div className={ className } ref={ el => this.el = el }>
        <TileWrapper {...this.props}
          ref="wrapper"
          layout={this.state.layout}
          dimensions={ this.state.dimensions }
          builder={ this.getQueryBuilder() }
          onResizeStart={ () => this.setState({resizing: true}) }
          onResizeEnd={ () => this.setState({resizing: false}) }
          onMoveStart={ this.onMoveStart }
          movingTile={ this.state.moving }
          minSizes={ minSizes }
        />
        <FloatingWrapper {...this.props}
          minSizes={ minSizes }
          tiles={ this.state.layout.floating }
          boxes={ this.state.floatingBoxes }
          builder={ this.getQueryBuilder() }
          onResizeStart={ this.onResizeStart }
          onMoveStart={ this.onMoveStart }
          onMoveStop={ this.onMoveStop } />
      </div>
    );
  }

  componentDidMount(){
    this.setState({ dimensions: this.calculateDimensions() });
    window.addEventListener( 'resize', () => {
      if( this.ticking ){
        return;
      }
      this.ticking = true;
      utils.requestAnimationFrame( () => {
        this.setState({ dimensions: this.calculateDimensions() });
        this.ticking = false;
      });
    });

    ContextQueryBuilder.resolver = this.props.resolver;
  }

  calculateDimensions(){
    return {
      width: this.el.clientWidth,
      height: this.el.clientHeight
    };
  }

  getRoute(){
    return this.props.resolver.getPath();
  }

  componentDidUpdate(){
    var layout = this.state.layout;
    if( this.state.currentLocation !== location.href ){
      layout = UrlParser.parse(this.getRoute());
      console.log( layout );
      this.setState({
        layout: layout,
        currentLocation: location.href,
        floatingBoxes: this.refreshBoxes( layout )
      });
    }
    ContextQueryBuilder.update(layout);
  }

  getQueryBuilder(){
    var queryBuilder = new QueryBuilder('/');
    queryBuilder.setLayout( this.state.layout );
    return queryBuilder;
  }

  setPathFormat(){
    var routeParts = location.href.split(location.host);
    if( routeParts[1] && routeParts[1].slice(0,2) === '/#' ){
      QueryBuilder.setPathFormat('/#');
    }
  }

  onMoveStop( tileData ){
    var wrapper = this.refs.wrapper.receiveTile( tileData );
    if( wrapper ){
      var builder = this.getQueryBuilder(),
        tileRoute = this.state.layout.floating[ tileData.id ],
        wrapperId = wrapper.isNew ? utils.tid( wrapper.type[0] ) : wrapper.id
      ;

      builder.remove( tileData.id, true );
      var type = wrapper.isNew ? wrapper.type : 'tile',
        route = builder.setTile({
          tile: tileData.id,
          route: tileRoute,
          type: type,
          wrapper: wrapperId
        })
      ;

      this.props.resolver.navigate( route );
    }

    this.setState({moving: false});
  }

  getInitialBoxes( layout ){
    var boxes = {},
      i = 0
    ;
    Object.keys(layout.floating).forEach( tileId => {
      boxes[ tileId ] = this.getInitialBox(i++);
    });
    return boxes;
  }

  refreshBoxes( layout ){
    var boxes = {},
      ids = Object.keys(layout.floating),
      i = ids.length
    ;

    ids.forEach( tileId => {
      boxes[ tileId ] = this.state.floatingBoxes[tileId] || this.getInitialBox(i++);
    });

    return boxes;
  }

  getInitialBox( i ){
    return {
      width: 400,
      height: 300,
      top: 100 + 50*i,
      left: 100 + 50*i
    };
  }

  calculateBox( start, dockedDimensions ){
    var playground = this.calculateDimensions(),
      box = {}
    ;

    box.width = Math.min( dockedDimensions.width, playground.width / 2 );
    box.height = Math.min( dockedDimensions.height, playground.height / 2 );
    box.left = start.left - (box.width / 2) ;
    box.top = start.top - 20;

    return box;
  }

  onMoveStart( e, tile, dimensions ){

		// Only left click and not a control
		if( e.button || e.target.tagName.toLowerCase() == 'a' )
			return;

		var me = this,
      start = { left: e.clientX, top: e.clientY },
      tid = tile.id,
      isFloating = !!me.state.layout.floating[ tid ],
      box = assign({}, isFloating ? me.state.floatingBoxes[ tid ] : this.calculateBox( start, dimensions ) ),
			moveStarted = false, // Flag to not to stop when the movement has started
			pos = {
				left: box.left,
				top: box.top
			},
			ticking = false,
			dragState = {moving: true, currentTile: tid},
			finished = false, // A flag to prevent reqAnimFrame to move after finish
			mm, mu
		;

		me.setState( dragState );

		window.addEventListener( 'mousemove', mm = function( e ){
			if( !ticking ){
				ticking = true;
				utils.requestAnimationFrame( function(){
					if( finished )
						return;
					var now = { left: e.clientX, top: e.clientY },
						left = now.left - start.left,
						top = now.top - start.top,
            update = {},
            boxes = assign( {}, me.state.floatingBoxes ),
            builder, nextLayout, nextBox
					;
					if( moveStarted || Math.abs( left ) > 20 || Math.abs( top ) > 20 ){
            // We start moving the tile here
            //
            if( !isFloating && !moveStarted ){
              // we are undocking a tile, remove the tile, create the box and
              // add it to the floating tiles
              builder = me.getQueryBuilder();
              builder.remove( tid, true );
              nextLayout = builder.setTile( {tile: tile.id, wrapper: 'floating', route: tile.route}, true, true );
              update.layout = nextLayout;
              boxes[ tid ] = box;
            }

						moveStarted = true;
            update.moving = {id: tid, x: e.clientX, y: e.clientY};

            boxes[tid] = assign({}, boxes[tid], {
              left: pos.left + left,
              top: pos.top + top
            });
            update.floatingBoxes = boxes;
						me.setState( update );
					}
					ticking = false;
				})
			}
		});

		window.addEventListener( 'mouseup', mu = function( e ){
			var update = {moving: false},
				tiles = assign( {}, me.state.dimensions )
			;

      var now = { left: e.clientX, top: e.clientY },
        left = now.left - start.left,
        top = now.top - start.top
      ;

      if( moveStarted ){
        var boxes = assign({}, me.state.floatingBoxes );
        boxes[tid] = assign({}, boxes[tid], {
          left: pos.left + left,
          top: pos.top + top
        });
        update.floatingBoxes = boxes;

        var wrapper = me.refs.wrapper.receiveTile( {x: e.clientX, y: e.clientY} );
        if( wrapper ){
          // Some wrapper has catched the tile
          var builder = me.getQueryBuilder(),
            wrapperId = wrapper.isNew ? utils.tid( wrapper.type[0] ) : wrapper.id
          ;

          builder.remove( tid, true );
          var type = wrapper.isNew ? wrapper.type : 'tile',
            route = builder.setTile({
              tile: tile.id,
              route: tile.route,
              type: type,
              wrapper: wrapperId
            })
          ;

          // If we delete the box, the tile will be moved to the origin
          // position before disappear
          //  delete update.floatingBoxes[ tid ];

          me.props.resolver.navigate( route );
        }
        else if( !isFloating ) {
          // we are undocking a tile, update the url
          me.props.resolver.navigate( UrlParser.stringify( me.state.layout ) );
        }
      }

			finished = true;

			me.setState( update );

			window.removeEventListener( 'mousemove', mm );
			window.removeEventListener( 'mouseup', mu );
		});
	}

  onResizeStart( direction, tid ){
		var me = this;

		return function( e ){
			var origin = { left: e.clientX, top: e.clientY },
				initial = assign({}, me.state.floatingBoxes[ tid ]),
				ticking = false,
				finished = false, // A flag to prevent reqAnimFrame to move after finish
				directions = {
					n: direction.indexOf('n') != -1,
					s: direction.indexOf('s') != -1,
					e: direction.indexOf('e') != -1,
					w: direction.indexOf('w') != -1,
				},
        maxN = origin.top + initial.height - minSizes.column,
        maxW = origin.left + initial.width - minSizes.row,
				mm, mu
			;

			me.setState({moving: true, currentTile: tid});
			window.addEventListener( 'mousemove', mm = function( e ){
				if( !ticking ){
					ticking = true;
					window.requestAnimationFrame( function(){
						if( finished )
							return;

						var floatingBoxes = assign({}, me.state.floatingBoxes ),
							style = assign({}, floatingBoxes[ tid ]),
              dim
						;

						if( directions.e ){
							style.width = Math.max(initial.width + e.clientX - origin.left, minSizes.row);
						}
						if( directions.s ){
							style.height = Math.max(initial.height + e.clientY - origin.top, minSizes.column);
						}
						if( directions.n ){
              dim = Math.min( maxN, e.clientY );
							style.height = initial.height + origin.top - dim;
							style.top = initial.top - origin.top + dim;
						}
						if( directions.w ){
              dim = Math.min( maxW, e.clientX );
							style.width = initial.width + origin.left - dim;
							style.left = initial.left - origin.left + dim;
						}

            floatingBoxes[tid] = style;

						me.setState({ floatingBoxes: floatingBoxes });
						ticking = false;
					});
				}
			});
			window.addEventListener( 'mouseup', mu = function( e ){
				me.setState({moving: false});
				window.removeEventListener( 'mousemove', mm );
				window.removeEventListener( 'mouseup', mu );
			});
		};
	}
};

Tiles.Link = TileLink;
Tiles.version = "0.5.0";
Tiles.Tile = Tile;

export default Tiles;
