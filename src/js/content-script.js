(function(){
  var browserId;
  chrome.runtime.sendMessage({type: 'registerScript'}, res => {
    console.log('Registering script', res.browserId);
    browserId = res.browserId;
  });

  document.addEventListener('click', e => {
    var a = e.target;
    if( !e.altKey || a.tagName.toLowerCase() !== 'a' || !a.href || a.href === '#' ) return;

    e.preventDefault();
    chrome.runtime.sendMessage({
      type: 'tileClick',
      url: a.href,
      hostUrl: location.href
    });
  });

  document.addEventListener('keydown', e => {
    if( e.altKey && e.which === 84 ){
      chrome.runtime.sendMessage({
        type: 'tileOpen',
        hostUrl: location.href
      });
    }
  });

  chrome.runtime.onMessage.addListener( e => {
    if( !e.browserId || e.browserId !== browserId ) return;

    if( e.type === 'browserReload' ){
      console.log('BROWSER RELOAD')
      location.reload();
    }
    else if( e.type === 'browserStop' ){
      console.log('BROWSER STOP')
      window.stop();
    }
  });
})();
