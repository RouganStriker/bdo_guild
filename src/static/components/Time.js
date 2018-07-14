import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Moment from 'react-moment';
const moment = require('moment-timezone');

class Time extends React.Component {
  guildTimeZone() {
    // Return the timezone of the guild
    const {
      guild,
      regions,
    } = this.props;

    if (!guild.selected) {
      return null;
    }

    return regions[guild.selected.region].timezone;
  }

  userTimeZone() {
    // Return the timezone of the user
    const {
      profile,
      regions,
    } = this.props;

    if (!profile.selected) {
      return null;
    }

    return regions[profile.selected.region].timezone;
  }

  render() {
    const {
      format,
      timezone
    } = this.props;

    let tz = timezone;

    if (timezone === 'guild') {
      tz = this.guildTimeZone();
    } else if (timezone === 'user') {
      tz = this.userTimeZone();
    }

    return (
      <Moment tz={tz || moment.tz.guess()} format={format}>
        {this.props.children}
      </Moment>
    );
  }
}

Time.propTypes = {
  format: PropTypes.string,
  timezone: PropTypes.string,
};

Time.defaultProps = {
  format: 'dddd, DD MMM YYYY HH:mm z',
  timezone: null,
};

const mapStateToProps = (state) => ({
  guild: state.guild,
  profile: state.profile,
  regions: state.auth.user.regions,
});

export default connect(mapStateToProps)(Time);