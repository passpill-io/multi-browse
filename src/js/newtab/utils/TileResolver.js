var router = require('../router').default;

module.exports = {
  init: function( props ){
  },
  navigate: function( path ){
    router.push(path);
  },
  getPath: function(){
    return location.href.split('#')[1] || '/';
  },
  resolve: function( path, callback ){
    var location = router.match( path );
    callback(location.matches[0]);
  }
}
