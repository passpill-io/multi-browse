var multiTabs = {
  tabs: {},
  browsers: {},
  frames: {},
  add: function( tabId ){
    this.tabs[tabId] = [];

    // console.log('Split tab added', tabId);
  },
  remove: function( tabId ){
    if( this.tabs[tabId] ){
      this.tabs[tabId].forEach( frame => {
        delete this.frames[frame.frameId];
        delete this.browsers[frame.browserId];
      });
      delete this.tabs[tabId]
      // console.log('Split tab removed', tabId);
    }
  },
  has: function( tabId ){
    return !!this.tabs[tabId];
  },
  registerFrame: function( tabId, frameId, browserId ){
    if( !this.tabs[tabId] ){
      return; // console.log("Can't register frame in a non split tab.");
    }

    var frame = {tabId, frameId, browserId};
    this.tabs[tabId].push(frame);
    this.frames[frameId] = frame;
    this.browsers[browserId] = frame;
  }
}

export default multiTabs;
