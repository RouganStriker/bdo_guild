import { gettext } from 'django-i18n';
import React, { Component } from 'react';
import { Field, FieldArray, reduxForm, submit, formValueSelector } from 'redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import Subheader from 'material-ui/Subheader';
import Save from 'material-ui/svg-icons/content/save';
import Dialog from 'material-ui/Dialog';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
const diff = require('object-diff');

import { renderTextField, renderSelectField, renderRadioGroup } from '../../components/Fields'
import Form from '../../components/Form'
import {
  ProfileService,
  WarAttendanceService,
} from '../../services';


class AttendanceFormDialog extends React.Component {

  handleCancel() {
    const { onClose } = this.props;

    if (onClose) {
      onClose();
    }
  }

  renderForm() {
    const { attendance, available_roles, characters, handleSubmit, submitting, is_attending } = this.props;

    return (
      <Form onSubmit={handleSubmit}>
        <label>Status</label>
        <Field name="is_attending"
               component={renderRadioGroup}
               className="form-field"
               disabled={submitting}>
          <RadioButton value={0}
                       label="Attending" />
          <RadioButton value={1}
                       label="Not Attending" />
        </Field>
        <Field name="character"
               component={renderSelectField}
               className="form-field"
               fullWidth={true}
               floatingLabelFixed={true}
               floatingLabelText="Character"
               hintText="Select Character"
               disabled={submitting || is_attending !== 0}>
          {
            characters.map(character => {
              return <MenuItem key={character.id} value={character.id} primaryText={character.name} />
            })
          }
        </Field>
        <Field name="preferred_roles"
               component={renderSelectField}
               className="form-field"
               fullWidth={true}
               floatingLabelFixed={true}
               floatingLabelText="Preferred Roles"
               hintText="Select Roles"
               multiple ={true}
               disabled={submitting || is_attending !== 0}>
          {
            available_roles.filter(role => role.id !== -1).map(role => {
              return <MenuItem key={role.id} value={role.id} primaryText={role.name} />
            })
          }
        </Field>
        <Field name="note"
               component={renderTextField}
               className="form-field"
               fullWidth={true}
               floatingLabelFixed={true}
               floatingLabelText="Note"
               hintText="Working, late, etc."
               multiLine={true}
               disabled={submitting} />
      </Form>
    );
  }

  render() {
    return this.renderContent();
  }

  renderContent() {
    const { open, title, submitting } = this.props;

    const actions = [
      <FlatButton
        label="Cancel"
        onClick={this.handleCancel.bind(this)}
        disabled={submitting}
      />,
      <FlatButton
        label="Save"
        primary={true}
        onClick={() => this.props.dispatch(submit('attendance'))}
        disabled={submitting}
      />,
    ];

    return (
      <Dialog
        actions={actions}
        title={title}
        modal={false}
        open={open}
        onRequestClose={this.handleCancel.bind(this)}
        autoScrollBodyContent={true}
        contentStyle={{maxWidth: 450}}
      >
        { this.renderForm() }
      </Dialog>

    );
  }
}

function submitForm(values, dispatch, props) {
  const {
    guild_id,
    onClose,
    war_id,
    profile_id,
    dirty,
    initialValues,
    handleSubmitSuccess,
  } = props;

  if (dirty) {
    const {
      preferred_roles,
      ...changes,
    } = diff(initialValues, values);

    const payload = {
      is_attending: values.is_attending,
      note: values.note,
      character: values.character,
    }

    if (preferred_roles !== null) {
      // Update preferred roles
      dispatch(ProfileService.updateSelected({
        payload: {
          preferred_roles,
        }
      }))
    }

    // Update attendance
    dispatch(WarAttendanceService.updateMyAttendance({
      context: {
        guild_id,
        war_id
      },
      payload: changes,
      form: 'attendance',
      onSuccess: handleSubmitSuccess,
    }))
  }
}

const getInitialValues = (state, props) => {
  const { warAttendance: { myAttendance } } = state;
  let initialValues = {
     is_attending: 0,
     character: null,
     note: null,
     preferred_roles: props.preferred_roles,
  };

  if (myAttendance){
    initialValues = {
      ...initialValues,
      is_attending: myAttendance.is_attending,
      character: myAttendance.character,
      note: myAttendance.note,
    };
  }

  return initialValues;
}

const selector = formValueSelector('attendance')

const mapStateToProps = (state, props) => ({
    auth: state.auth,
    initialValues: getInitialValues(state, props),
    is_attending: selector(state, 'is_attending'),
});

const formOptions = {
  form: "attendance",
  onSubmit: submitForm,
};

AttendanceFormDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  characters: PropTypes.array,
  available_roles: PropTypes.array,
  profile_id: PropTypes.number,
  preferred_roles: PropTypes.array,
  guild_id: PropTypes.number,
  war_id: PropTypes.number,
};

AttendanceFormDialog.defaultProps = {
  title: "Edit Attendance",
  open: false,
  characters: [],
  available_roles: [],
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(AttendanceFormDialog)
);
