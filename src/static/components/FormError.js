import PropTypes from 'prop-types';
import React from 'react';
import WarningIcon from 'material-ui/svg-icons/alert/warning';
import {red500} from 'material-ui/styles/colors';


class FormError extends React.Component {
  render() {
    const { message } = this.props

    return (
      <div style={{color: red500}}>
        <div style={{display: "inline-flex", margin: "8px 0px", verticalAlign: "middle", lineHeight: "24px"}}>
          <WarningIcon color={red500} style={{marginRight: 16}}/> Save failed due to the following errors:
        </div>
        {message}
      </div>
    );
  }
}

FormError.propTypes = {
  message: PropTypes.string,
};

export default FormError;
