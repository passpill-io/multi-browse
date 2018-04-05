import onState from 'onstate';

var store = onState({
  browsers: {
    /*
      id: {
        history: [],
        hitoryIndex: [],
        lastPropUrl: '',
        suggestions: []
      }
    */
  }
});

window.store = store;
export default store;
