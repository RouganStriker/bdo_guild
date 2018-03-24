import { gettext } from 'django-i18n';
import React, { Component } from 'react';
import { Field, FieldArray, reduxForm, change, submit, formValueSelector } from 'redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';
import Dialog from 'material-ui/Dialog';
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import {Card, CardHeader, CardText} from 'material-ui/Card';
const moment = require('moment-timezone')

import { renderTextField, renderChipField, renderSelectField, renderRadioGroup, renderDateField } from '../../components/Fields';
import Form from '../../components/Form';
import {
  GuildService,
} from '../../services';


class GuildFormDialog extends React.Component {

  handleCancel() {
    const { onClose } = this.props;

    if (onClose) {
      onClose();
    }
  }

  renderDiscordSection() {
    const { canEditIntegration, submitting, user } = this.props;
    const bot_invite_url = "https://discordapp.com/api/oauth2/authorize?client_id=336354195684851712&permissions=0&redirect_uri=http%3A%2F%2F192.168.56.102%3A8000%2Faccounts%2Fdiscord_auth%2Flogin%2Fcallback%2F&scope=bot";
    const link_params = {
      href: bot_invite_url,
      rel: "noopener noreferrer",
      target: "_blank",
    }
    const read_only = !canEditIntegration;

    return (
      <Card initiallyExpanded={true}
            style={{boxShadow: null}}>
        <CardHeader title="Discord Integration"
                    actAsExpander={true}
                    showExpandableButton={true}
                    style={{paddingLeft: 0, paddingRight: 0}} />
        <CardText expandable={true}
                  style={{paddingLeft: 0, paddingRight: 0, paddingTop: 0}}>
          <div>
            <span>Automatically synchronize user roles based on their role in Discord. </span>
            { canEditIntegration && <span>To complete the integration, <a {...link_params}>add the BDOGuild bot to your server.</a></span> }
          </div>

          {
            read_only &&
            <Field name="discord_id"
                   component={renderTextField}
                   className="form-field"
                   fullWidth={true}
                   floatingLabelText="Discord Server ID"
                   disabled={true} /> ||
            <Field name="discord_id"
                   component={renderSelectField}
                   className="form-field"
                   fullWidth={true}
                   floatingLabelText="Discord Server"
                   hintText="Select a server you have MANAGE_SERVER permission in"
                   disabled={submitting}>
              {
                user.discord_servers.map((server) => {
                  return <MenuItem key={server[0]} value={server[0]} primaryText={server[1]} />
                })
              }
            </Field>
          }

          <Field name="discord_roles.2"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Officer Mapping"
                 hintText="Discord Role Name"
                 disabled={submitting || read_only} />
          <Field name="discord_roles.3"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Quartermaster Mapping"
                 hintText="Discord Role Name"
                 disabled={submitting || read_only} />
          <Field name="discord_roles.4"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Member Mapping"
                 hintText="Discord Role Name"
                 disabled={submitting || read_only} />
          <Field name="discord_roles.5"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Mercenary Mapping"
                 hintText="Discord Role Name"
                 disabled={submitting || read_only} />

        </CardText>
      </Card>
    )
  }
  renderForm() {
    const { handleSubmit, submitting } = this.props;

    return (
      <Form onSubmit={handleSubmit}>
        <Field name="description"
               component={renderTextField}
               className="form-field"
               fullWidth={true}
               floatingLabelText="Description"
               multiLine={true}
               rowsMax={4}
               disabled={submitting} />

        { this.renderDiscordSection() }
      </Form>
    );
  }

  render() {
    return this.renderContent();
  }

  renderContent() {
    const { open, submitting, guild } = this.props;
    const title = "Edit Guild";
    const actions = [
      <FlatButton
        label="Cancel"
        onClick={this.handleCancel.bind(this)}
        disabled={submitting}
      />,
      <FlatButton
        label={"Save"}
        primary={true}
        onClick={() => this.props.dispatch(submit('guild'))}
        disabled={submitting}
      />,
    ];

    if (!guild.selected) {
      return null;
    }

    return (
      <Dialog
        actions={actions}
        title={title}
        modal={false}
        open={open}
        onRequestClose={this.handleCancel.bind(this)}
        contentStyle={{maxWidth: 550}}
        autoScrollBodyContent={true}
      >
        { this.renderForm() }
      </Dialog>
    );
  }
}

function submitForm(values, dispatch, props) {
  const { handleSubmitSuccess, guild, onClose, dirty, war } = props;

  if (!dirty) {
    onClose && onClose();
    return;
  }

  dispatch(GuildService.update({id: guild.selected.id, payload: values, form: 'guild', onSuccess: handleSubmitSuccess}))
}

const getInitialValues = (state) => {
  const { guild } = state;

  if (guild.selected) {
    const {
      name,
      description,
      discord_id,
      discord_roles,
    } = guild.selected;

    return {
      name,
      description,
      discord_id,
      discord_roles,
    }
  }
}

const mapStateToProps = state => ({
  user: state.auth.user,
  initialValues: getInitialValues(state),
  guild: state.guild,
  profile: state.profile.selected,
});

const formOptions = {
  form: "guild",
  onSubmit: submitForm,
};

GuildFormDialog.propTypes = {
  open: PropTypes.bool,
  handleSubmitSuccess: PropTypes.func,
  onClose: PropTypes.func,
  canEditIntegration: PropTypes.bool,
};

GuildFormDialog.defaultProps = {
  open: false,
  canEditIntegration: false,
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(GuildFormDialog)
);
