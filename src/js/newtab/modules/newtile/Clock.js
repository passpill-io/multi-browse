import React, { Component } from 'react';

class Clock extends Component {
  state = {
    minutes: ''
  }

  render() {
    var d = this.getCurrentTime();

    return (
      <div className="clock">
        <div className="time">
          <span className="hours">{d.hours}</span>
          <span className="colon">:</span>
          <span className="minutes">{d.minutes}</span>
        </div>
        <div className="date">
          <span className="weekDay">{d.day}</span>
          <span className="monthDay">{d.date}</span>
        </div>
      </div>
    );
  }

  getCurrentTime(){
    var d = new Date();
    return {
      hours: this.pad( this.getFormatted(d, {hour:'2-digit'}) ),
      minutes: this.pad( this.getFormatted(d, {minute:'2-digit'}) ),
      day: this.getFormatted(d, {weekday: 'short'}).replace('.', ''),
      date: this.getFormatted(d, {day: '2-digit'})
    };
  }

  getFormatted( d, options ){
    return (new Intl.DateTimeFormat(undefined, options)).format(d);
  }

  pad( text ){
    if( text.length === 1 ){
      return '0' + text;
    }
    return text;
  }

  componentDidMount(){
    setInterval( () => {
      var m = (new Date()).getMinutes();
      if( m !== this.state.minutes ){
        this.setState({minutes: m});
      }
    }, 1000 );
  }

}

export default Clock;
