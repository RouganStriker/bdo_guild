import { gettext } from 'django-i18n';
import React, { Component } from 'react';
import { Field, FieldArray, reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import Subheader from 'material-ui/Subheader';
import Save from 'material-ui/svg-icons/content/save';
import Dialog from 'material-ui/Dialog';

import { renderTextField, renderSelectField } from '../../components/Fields'
import ProfileService from '../../services/users/profile/service'
import Form from '../../components/Form'

class ProfileForm extends React.Component {
  componentWillMount() {
    this.setState({
      open: false,
    });
  }

  submit(values, dispatch) {
    const { id, family_name } = values

    dispatch(ProfileService.update({ id, payload: { family_name } }));

    this.handleClose()
  }

  renderCharacter({ fields, meta: { error } }) {
    return (
      <div>
        {fields.map((name, i) => {
          const index = i + 1;

          return (
            <fieldset key={name} className="form-fieldset">
              <Field name="character_name"
                     component={renderTextField}
                     label="Character Name"
                     className="form-field"
                     style={{width: 255}} />
              <Field name="class"
                     component={renderSelectField}
                     label="Class"
                     className="form-field"
                     style={{width: 150, verticalAlign: "bottom" }}
                     menuStyle={{ verticalAlign: "bottom" }}>
                 <MenuItem>Valkyrie</MenuItem>
                 <MenuItem>Warrior</MenuItem>
              </Field>
              <Field name="level"
                     component={renderTextField}
                     label="Level"
                     className="form-field"
                     style={{width: 70}} />
              <Field name="ap"
                     component={renderTextField}
                     label="AP"
                     className="form-field"
                     style={{width: 70}} />
              <Field name="aap"
                     component={renderTextField}
                     label="Awak. AP"
                     className="form-field"
                     style={{width: 70}} />
              <Field name="dp"
                     component={renderTextField}
                     label="DP"
                     className="form-field"
                     style={{width: 70}} />
            </fieldset>
          );
        })}
        <label className="sde-form-label">
          <a onClick={() => fields.push({ 'question': '', 'answer': '' })}>
            ({ gettext('add another question') })
          </a>
        </label>
      </div>
    )
  }

  confirmSave() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false });
  }

  renderConfirmDialog() {
    const { open } = this.state;
    const { handleSubmit } = this.props;
    const actions = [
      <FlatButton
        label="Cancel"
        onClick={this.handleClose.bind(this)}
      />,
      <FlatButton
        label="Confirm"
        primary={true}
        onClick={handleSubmit(this.submit.bind(this))}
      />,
    ];

    return (
      <Dialog
          modal={false}
          open={open}
          actions={actions}>
        Once set, your family name cannot be changed.
      </Dialog>
    );
  }

  render() {
    const { family_name } = this.props.initialValues;
    const disabled = family_name != null
    const tooltip = !disabled ? gettext("Save") : gettext("Family name cannot be changed")

    return (
      <Form>
        <h4>Family</h4>
        <Divider />
        <Field name="family_name"
               component={renderTextField}
               label="Family Name"
               disabled={disabled}
               className="form-field" />

        { this.renderConfirmDialog() }
      </Form>
    );
  }
}

const mapStateToProps = state => ({
  initialValues: state.profile.selected,
});

const formOptions = {
  form: 'profile',
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(ProfileForm)
);
