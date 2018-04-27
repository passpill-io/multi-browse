import React from 'react';

class IframeTile extends React.Component {
  render(){
    return (
      <iframe src={ this.props.layout.route } sandbox="allow-same-origin allow-scripts allow-popups allow-forms"/>
    )
  }
};

export default IframeTile;
