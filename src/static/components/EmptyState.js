import React from 'react';
import PropTypes from 'prop-types';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';


class EmptyState extends React.Component {

  render() {
    const { text } = this.props;

    return (
      <div style={{
             textAlign: "center",
             padding: 20,
           }}>
        { text }
      </div>
    )
  }
}

export default EmptyState;