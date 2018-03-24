import React from 'react';
import PropTypes from 'prop-types';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';


class ConfirmDialog extends React.Component {
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
};

ConfirmDialog.defaultProps = {
  title: null
};

export default ConfirmDialog;
