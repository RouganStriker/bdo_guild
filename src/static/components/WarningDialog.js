import React from 'react';
import PropTypes from 'prop-types';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';


class WarningDialog extends React.Component {
  render() {
    const {
      open,
      onCancel,
      onConfirm,
      title,
      content
    } = this.props;

    const actions = [
      <FlatButton
        label="Cancel"
        onClick={onCancel}
      />,
      <FlatButton
        label="Confirm"
        primary={true}
        onClick={onConfirm}
      />,
    ];

    return (
      <Dialog
          title={title}
          modal={true}
          actions={actions}
          onRequestClose={onCancel}
          open={open}>
        {content}
      </Dialog>
    );
  }
}

WarningDialog.propTypes = {
  open: PropTypes.bool,
  content: PropTypes.node,
  title: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

WarningDialog.defaultProps = {

};

export default WarningDialog;
