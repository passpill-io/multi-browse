import React, { Component } from 'react';
import store from 'state/store';
import Icon from 'modules/common/Icon';

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
    if( s.results && s.results.length ){
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
    if( !s || !s.results.length ) return;

    var items = s.results.map( (r,i) => {
      var cn = `sSuggestion s_${r.type}`;
      if( this.state.suggestionSelected === i ){
        cn += ' selected';
      }

      return (
        <a key={i} className={ cn } onClick={ () => this.go(r.value) } >
          <span className="sContainer">
            <Icon type={ r.type } />
            <span className="sText">{ this.renderSuggestionText( s.q, r.text ) }</span>
            <span className="sTitle"> - { r.type === 'page' ? this.renderSuggestionText(s.q, r.title) : 'Google Search' }</span>
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

    if( key === 38 && !current || key === 40 && current >= this.state.suggestions.results.length - 1 ){
      return;
    }

    e.preventDefault();

    next = key === 38 ? current - 1 : current + 1;

    this.setState({
      value: this.state.suggestions.results[next].value,
      suggestedValue: false,
      suggestionSelected: next
    });
  }

  go( url ){
    var q = (url || this.state.suggestedValue || this.state.value).trim();

    if(!q) return;

    if( q.startsWith("http") ){
      return this.props.onUrl(q);
    }
    if( q.match(/.+\..+/) ){
      return this.props.onUrl(`http://${q}`);
    }

    this.props.onUrl(`https://www.google.es/search?q=${encodeURIComponent(q)}`) ;
  }

  componentWillReceiveProps(nextProps){
    if( nextProps.url !== this.state.propUrl ){
      this.setState({
        value: nextProps.url,
        propUrl: nextProps.url,
        suggestedValue: false,
        suggestions: false
      });
    }
  }

  updateWithSuggestions( text ){
    if( text === this.state.value ){
      return this.setState({suggestedValue: false});
    };

    this.setState({
      value: text,
      suggestedValue: false
    });

    store.emit('search:getSuggestions', text )
      .then( suggestions => {
        console.log( this );
        if( suggestions.q !== this.state.value ) return;

        var parsed = this.parseSuggestions(suggestions),
          update = {
            suggestions: parsed,
            suggestionSelected: 0
          }
        ;

        if( parsed.selection ){
          update.suggestedValue = parsed.results[0].value;
        }
        else {
          update.suggestedValue = false;
        }

        this.setState( update );
      })
    ;
  }

  parseSuggestions( res ){
    var firstUrl = this.cleanUrlTitle( res.suggestions[0].url );
    var selection = false;
    var results = [];
    if( firstUrl && firstUrl.indexOf(res.q) === 0 ){
      selection = [ res.q.length, firstUrl.length];
    }
    else {
      results.unshift({
        type: 'search',
        text: []
      });
      if( res.suggestions.length === 6 ){
        res.suggestions.pop();
      }
    }

    res.suggestions.forEach( s => {
      if( s.url ){
        results.push({
          type: 'page',
          text: this.cleanUrlTitle( s.url ).split(res.q),
          title: s.title.split( res.q ),
          value: this.cleanUrlTitle( s.url )
        });
      }
      else {
        results.push({
          type: 'search',
          text: s.text.split( res.q ),
          value: s.text
        });
      }
    });

    return {
      q: res.q,
      selection: selection,
      results: results
    };
  }

  cleanUrlTitle( url ){
    if(!url) return '';
    return url.replace(/^https?:\/\/(www\.)?/i, '');
  }

  componentDidUpdate( prevProps, prevState ){
    var s = this.state.suggestions;
    if( s && s.selection && s !== prevState.suggestions ){
      this.input.focus();
      this.input.setSelectionRange( s.selection[0], s.selection[1], "backward" );
    }
  }
}

export default Search;
