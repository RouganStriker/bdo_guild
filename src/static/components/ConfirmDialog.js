import React from 'react';
import PropTypes from 'prop-types';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';


class ConfirmDialog extends React.Component {
  render() {
    const {
      buttonsDisabled,
      open,
      onCancel,
      onConfirm,
      title,
      content
    } = this.props;

    const actions = [
      <FlatButton
        label="Cancel"
        disabled={buttonsDisabled}
        onClick={onCancel}
      />,
      <FlatButton
        label="Confirm"
        primary={true}
        disabled={buttonsDisabled}
        onClick={onConfirm}
      />,
    ];

    return (
      <Dialog
          title={title}
          modal={false}
          actions={actions}
          onRequestClose={onCancel}
          open={open}>
        {content}
      </Dialog>
    );
  }
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool,
  content: PropTypes.node,
  title: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  buttonsDisabled: PropTypes.bool,
};

ConfirmDialog.defaultProps = {
  open: true,
};

export default ConfirmDialog;
