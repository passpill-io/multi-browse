var isDev = (process.env.NODE_ENV === 'development');

function getJSON( clbk ){
  if( isDev ){
    return getLocalJSON( clbk );
  }
  return getRemoteJSON( clbk );
}


function getRemoteJSON( clbk ){
  fetch('http://multi-browse.s3-website.us-east-2.amazonaws.com/images.json')
    .then( res => res.json() )
    .then( data => clbk(data) )
  ;
}

function getLocalJSON( clbk ){
  fetch('/images/images.json')
    .then( res => res.json() )
    .then( data => {
      data.forEach( image => {
        image.url = `/images/upload/${image.url}`;
      });
      clbk(data);
    })
  ;
}

export default {getJSON};
