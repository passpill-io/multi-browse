(function(){
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
})();
