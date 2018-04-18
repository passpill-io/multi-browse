(function(){
  var browserId;
  chrome.runtime.sendMessage({type: 'registerScript'}, res => {
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
    if( e.type !== 'browserReload' || e.browserId !== browserId ) return;
    location.reload();
  });
})();
