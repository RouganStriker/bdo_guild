import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Moment from 'react-moment';
const moment = require('moment-timezone')

class Time extends React.Component {
  render() {
    const { format } = this.props;

    return (
      <Moment tz={moment.tz.guess()} format={format}>
        {this.props.children}
      </Moment>
    );
  }
}

Time.propTypes = {
  format: PropTypes.string,
};

Time.defaultProps = {
  format: 'dddd, DD MMM YYYY HH:mm z',
};

export default Time;