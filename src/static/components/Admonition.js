import React, { Component } from 'react';
import PropTypes from 'prop-types';
import InfoIcon from 'material-ui/svg-icons/action/info';
import WarnIcon from 'material-ui/svg-icons/alert/warning';
import ErrorIcon from 'material-ui/svg-icons/alert/error';
import {
  blue500,
  blue50,
  red500,
  red50,
  yellow700,
  yellow50
} from 'material-ui/styles/colors';


class Admonition extends React.Component {
  constructor() {
    super();

    this.primaryColorMapping = {
      'info': blue500,
      'warn': yellow700,
      'error': red500,
    }
    this.secondaryColorMapping = {
      'info': blue50,
      'warn': yellow50,
      'error': red50,
    }

    this.iconMapping = {
      'info': <InfoIcon color={this.primaryColorMapping['info']} />,
      'warn': <WarnIcon color={this.primaryColorMapping['warn']} />,
      'error': <ErrorIcon color={this.primaryColorMapping['error']} />,
    }
  }

  render() {
    const { content, type } = this.props;
    const containerStyle = {
      margin: "16px 0px",
      display: "flex",
      backgroundColor: this.secondaryColorMapping[type],
      border: "1px solid",
      borderColor: this.primaryColorMapping[type],
      borderRadius: "8px",
      padding: 8,
      color: "#333",
    }
    const contentStyle = {
      lineHeight: "24px",
      marginLeft: "16px",
    }

    if (!content) {
      return null;
    }

    return (
      <div style={containerStyle}>
        { this.iconMapping[type] }
        <span style={contentStyle}>
          { content }
        </span>
      </div>
    );
  }
}

Admonition.propTypes = {
  content: PropTypes.string.required,
  type: PropTypes.oneOf([
    'info',
    'warn',
    'error',
  ]),
};

Admonition.defaultProps = {
  type: 'info',
};

export default Admonition;