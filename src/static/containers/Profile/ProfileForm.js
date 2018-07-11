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
import HelpIcon from 'material-ui/svg-icons/action/help';
import { toast } from 'react-toastify';

import { renderTextField, renderSelectField } from '../../components/Fields'
import ProfileService from '../../services/users/profile/service'
import Tooltip from '../../components/Tooltip';
import Form from '../../components/Form'

class ProfileForm extends React.Component {

  render() {
    const {
      handleSubmit,
      regions,
      submitting,
    } = this.props;

    return (
      <Form onSubmit={handleSubmit}>
        <h4>Family</h4>
        <Divider />
        <div>
          <Field name="family_name"
                 component={renderTextField}
                 label="Family Name"
                 disabled={true}
                 className="form-field" />
          <Tooltip label="To change your family name please contact support@bdoguilds.com">
            <HelpIcon />
          </Tooltip>
        </div>

        <div>
          <Field name="region"
                 component={renderSelectField}
                 label="Region"
                 disabled={true}
                 className="form-field">
            {
              Object.keys(regions).map((key) => {
                return <MenuItem key={parseInt(key)} value={parseInt(key)} primaryText={regions[key].name} />;
              })
            }
          </Field>
        </div>

        <div>
          <Field name="npc_renown"
                 component={renderSelectField}
                 label="NPC Renown"
                 disabled={submitting}
                 className="form-field">
            <MenuItem primaryText="0" value={0} />
            <MenuItem primaryText="1" value={1} />
            <MenuItem primaryText="2" value={2} />
            <MenuItem primaryText="3" value={3} />
            <MenuItem primaryText="4" value={4} />
            <MenuItem primaryText="5" value={5} />
          </Field>
        </div>
      </Form>
    );
  }
}

const mapStateToProps = state => ({
  profile_id: state.profile.selected.id,
  initialValues: state.profile.selected,
  regions: state.auth.user.regions,
});

const formOptions = {
  form: 'profile',
  onSubmit: (values, dispatch, props, previousValues) => {
    const { npc_renown, region } = values;
    const { profile_id } = props;

    dispatch(ProfileService.updateSelected({
      payload: { npc_renown, region },
      onSuccess: () => toast.success("Profile has been updated"),
    }));
  },
  onChange: (values, dispatch, props, previousValues) => {
      props.submit();
  },
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(ProfileForm)
);
