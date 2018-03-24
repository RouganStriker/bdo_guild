import { connect } from 'react-redux';
import Dialog from 'material-ui/Dialog';
import Divider from 'material-ui/Divider';
import { Field, reduxForm, submit } from 'redux-form';
import FlatButton from 'material-ui/FlatButton';
import { gettext } from 'django-i18n';
import PropTypes from 'prop-types';
import React from 'react';

import { WarCallSignService } from '../../services';
import Form from '../../components/Form';
import LoadingWidget from '../../components/LoadingWidget';
import { renderTextField } from '../../components/Fields';
const diff = require('object-diff');

const form_name = 'call_sign';

class CallSignFormDialog extends React.Component {
  componentDidUpdate() {
    const { handleSubmitSuccess, submitSucceeded, submitting } = this.props;

    if (handleSubmitSuccess && !submitting && submitSucceeded) {
      handleSubmitSuccess();
    }
  }

  handleCancel() {
    const { onClose } = this.props;

    if (onClose) {
      onClose();
    }
  }

  renderForm() {
    const { handleSubmit, submitting } = this.props;

    return (
      <Form onSubmit={handleSubmit}>
        <Field name="name"
               component={renderTextField}
               className="form-field"
               style={{maxWidth: 300, display: "block"}}
               floatingLabelFixed={true}
               floatingLabelText="Call Sign"
               hintText="Enter call sign"
               disabled={submitting} />
      </Form>
    );
  }

  render() {
    return this.renderContent();
  }

  renderContent() {
    const { creating, open, title, submitting } = this.props;
    const dialog_title = title || (creating && gettext("Add Call Sign")) || gettext("Edit Call Sign")

    const actions = [
      <FlatButton
        label="Cancel"
        onClick={this.handleCancel.bind(this)}
        disabled={submitting}
      />,
      <FlatButton
        label="Save"
        primary={true}
        onClick={() => this.props.dispatch(submit(form_name))}
        disabled={submitting}
      />,
    ];

    return (
      <Dialog
        actions={actions}
        title={dialog_title}
        modal={false}
        open={open}
        onRequestClose={this.handleCancel.bind(this)}
        contentStyle={{maxWidth: 550}}
        autoScrollBodyContent={true}
      >
        { false && <LoadingWidget />}
        { this.renderForm() }
      </Dialog>

    );
  }
}

function submitForm(values, dispatch, props) {
  const { dirty, guild_id, war_id, initialValues } = props;

  if (!dirty) {
    return
  }
  if (!initialValues) {
    dispatch(WarCallSignService.create({ payload: values, context: { guild_id, war_id }, form: form_name }))
  } else {
    const changes = diff(initialValues, values);
    dispatch(WarCallSignService.update({ id: initialValues.id, payload: changes, context: { guild_id, war_id }, form: form_name }))
  }
}

const mapStateToProps = state => ({
  creating: state.call_sign.selected === null,
});

const formOptions = {
  form: form_name,
  onSubmit: submitForm,
};

CallSignFormDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  initialValues: PropTypes.object,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  war_id: PropTypes.number,
  guild_id: PropTypes.number,
};

CallSignFormDialog.defaultProps = {
  open: true,
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(CallSignFormDialog)
);
