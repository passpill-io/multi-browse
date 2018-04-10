import React, { Component } from 'react';
import store from 'state/store';
import Icon from 'modules/common/Icon';
import SuggestionCache from 'utils/SuggestionCache';

class Search extends Component {
  constructor( props ){
    super( props );
    this.state = {
      value: props.url || '',
      suggestedValue: '',
      suggestions: false,
      focused: false,
      propUrl: props.url
    };
  }

  render() {
    var cn = 'search',
      s = this.state.suggestions
    ;

    if( this.state.focused ){
      cn += ' focused';
    }
    if( s && s.length ){
      cn += ' withSuggestions';
    }

    return (
      <div className={ cn }>
        <input type="text" value={ this.state.suggestedValue || this.state.value }
          ref={ input => this.input = input }
          onFocus={ e => this.onFocus() }
          onBlur={ e => this.onBlur() }
          onChange={ e => this.updateWithSuggestions( e.target.value ) }
          onKeyDown={ e => this.onKeyDown( e ) } />
        { this.renderSuggestions() }
      </div>
    );
  }

  renderSuggestions(){
    var s = this.state.suggestions;
    if( !s || !s.length ) return;

    var items = s.map( (r,i) => {
      var cn = `sSuggestion s_${r.type}`;
      if( this.state.suggestionSelected === i ){
        cn += ' selected';
      }

      return (
        <a key={i} className={ cn } onClick={ () => this.go(r.value) } >
          <span className="sContainer">
            <Icon type={ r.type } />
            <span className="sText">{ this.renderSuggestionText( this.state.q, r.text ) }</span>
            <span className="sTitle"> - { r.type === 'page' ? this.renderSuggestionText(this.state.q, r.title) : 'Google Search' }</span>
          </span>
        </a>
      );
    });

    return (
      <div className="sSuggestions">
        { items }
      </div>
    );
  }

  renderSuggestionText( query, parts ){
    if( !parts.length ) return <b>{query}</b>;
    if( parts.length === 1 ) return parts[0] || <b>{ query }</b>;
    var items = [];
    parts.forEach( (p, i) => {
      if( i ){
        items.push( <b key={i}>{ query }</b> );
      }
      items.push( <span>{p}</span> );
    });

    return (
      <span className="sCompoundText">
        { items }
      </span>
    );
  }

  focus(){
    this.input.focus();
  }

  onFocus(){
    this.input.select();
    setTimeout( () => {
      this.setState({
        focused: true
      });
    },100);
  }

  onBlur(){
    setTimeout( () => {
      this.setState({
        focused: false
      });
    },100);
  }

  onKeyDown( e ){
    var key = e.which;

    // Enter
    if( key === 13 ) return this.go();
    if( key !== 38 && key !== 40 ) return;

    var current = this.state.suggestionSelected,
      next
    ;

    if( key === 38 && !current || key === 40 && current >= this.state.suggestions.length - 1 ){
      return;
    }

    e.preventDefault();

    next = key === 38 ? current - 1 : current + 1;

    this.setState({
      value: this.state.suggestions[next].value,
      suggestedValue: false,
      suggestionSelected: next
    });
  }

  go( text ){
    var q = (text || this.state.suggestedValue || this.state.value).trim();

    if(!q) return;

    var url;
    if( q.startsWith("http") ){
      url = q;
    } else if( q.match(/[^\s]+\.[^\s]+/) ){
      url = `http://${q}`;
    }
    else {
      url = `https://www.google.es/search?q=${encodeURIComponent(q)}`;
    }

    store.emit('browser:navigate', this.props.browserId, url );
  }

  componentWillReceiveProps(nextProps){
    if( nextProps.url !== this.state.propUrl ){
      this.setState({
        value: nextProps.url,
        propUrl: nextProps.url,
        suggestedValue: false,
        suggestions: false,
        q: false
      });
    }
  }

  updateWithSuggestions( text ){
    if( text === this.state.value ){
      return this.setState({
        suggestedValue: false,
        q: text,
        suggestionSelected: 0,
        suggestions: SuggestionCache.get( text, true ).suggestions
      });
    };

    var isBack = this.state.value.indexOf( text ) === 0,
      cache = SuggestionCache.get( text, isBack ),
      update = {
        value: text,
        suggestedValue: false,
        q: text
      }
    ;

    if( cache ){
      update.suggestions = cache.suggestions;
      update.suggestionSelected = 0;
      if( !isBack && cache.suggestions.length && cache.suggestions[0].type === 'page' ){
        update.selection = [text.length, cache.suggestions[0].value.length];
      }
      else {
        update.selection = false;
      }
    }

    this.setState(update);

    if( isBack || cache && cache.complete ){
      return;
    }

    store.emit('search:getSuggestions', this.props.browserId, text )
      .then( data => {
        SuggestionCache.add( data );
        if( data.q !== this.state.value ) return;

        var cache = SuggestionCache.get( this.state.value ),
          suggestedValue = cache && cache.suggestions.length && cache.suggestions[0].value,
          selection = suggestedValue && cache.suggestions[0].type === 'page' && [data.q.length, suggestedValue.length]
        ;

        this.setState({
          suggestions: cache.suggestions || [],
          suggestionSelected: 0,
          suggestedValue, selection
        });
      })
    ;
  }

  componentDidMount(){
    this.onMessage = msg => {
      if( !msg || msg.browserId !== this.props.browserId ) return;
      if( msg.type !== 'webSuggestions' && msg.type !== 'historySuggestions' ) return;
      SuggestionCache.add( msg );
      if( msg.q === this.state.value ){
        this.setState({
          suggestions: SuggestionCache.get(msg.q).suggestions
        });
      }
    };
    chrome.runtime.onMessage.addListener( this.onMessage );
  }

  componentWillUnmount(){
    chrome.runtime.onMessage.removeListener( this.onMesage );
  }

  componentDidUpdate( prevProps, prevState ){
    var s = this.state.suggestions;
    if( this.state.selection && this.state.selection !== prevState.selection ){
      this.input.focus();
      this.input.setSelectionRange( this.state.selection[0], this.state.selection[1], "backward" );
    }
  }
}

export default Search;
