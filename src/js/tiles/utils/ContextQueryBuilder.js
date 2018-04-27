import Builder from './QueryBuilder';

var cache = {
  builder: false,
  layout: false
}

export default {
  update( layout ){
    var b = new Builder('/');
    b.setLayout( layout );

    cache.builder = b;
    cache.layout = layout;
  },
  setTile(){
    return cache.builder.setTile.apply( cache.builder, arguments );
  }
}
