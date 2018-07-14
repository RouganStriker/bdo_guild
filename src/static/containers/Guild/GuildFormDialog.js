import { gettext } from 'django-i18n';
import React, { Component } from 'react';
import { Field, FieldArray, formValueSelector, reduxForm, change, submit } from 'redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import { RadioButton } from 'material-ui/RadioButton';
import IconButton from 'material-ui/IconButton';
import Subheader from 'material-ui/Subheader';
import Dialog from 'material-ui/Dialog';
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import {Card, CardHeader, CardText} from 'material-ui/Card';
const moment = require('moment-timezone')

import { renderTextField, renderSelectField, renderToggle, renderRadioGroup } from '../../components/Fields';
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
    const {
      canEditIntegration,
      currentWebhook,
      submitting,
      user
    } = this.props;
    const bot_invite_url = "https://discordapp.com/api/oauth2/authorize?client_id=336354195684851712&permissions=0&scope=bot";
    const link_params = {
      href: bot_invite_url,
      rel: "noopener noreferrer",
      target: "_blank",
    }
    const read_only = !canEditIntegration;
    const disableButtons = submitting || read_only;

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
            Automatically synchronize user roles based on their role in Discord.
            {
              canEditIntegration &&
              <div style={{paddingTop: 6}}>
                To complete the integration, <a className="link" {...link_params}>add the BDOGuild bot to your server.</a>
              </div>
            }
          </div>

          <Field name="discord_id"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Discord Server ID"
                 floatingLabelFixed={true}
                 hintText="Server Settings > Widget > Server ID"
                 disabled={disableButtons} />

          <Field name="discord_roles.2"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Officer Mapping"
                 floatingLabelFixed={true}
                 hintText="Discord Role Name"
                 disabled={disableButtons} />
          <Field name="discord_roles.3"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Quartermaster Mapping"
                 floatingLabelFixed={true}
                 hintText="Discord Role Name"
                 disabled={disableButtons} />
          <Field name="discord_roles.4"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Member Mapping"
                 floatingLabelFixed={true}
                 hintText="Discord Role Name"
                 disabled={disableButtons} />
          <Field name="discord_roles.5"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Mercenary Mapping"
                 floatingLabelFixed={true}
                 hintText="Discord Role Name"
                 disabled={disableButtons} />

          <Divider style={{marginTop: 15, marginBottom: 15}}/>
          <div>Notification Settings</div>

          <Field name="discord_webhook"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Discord Webhook"
                 floatingLabelFixed={true}
                 hintText="Notifications are post via this webhook"
                 disabled={disableButtons} />

          <Field name="discord_notifications.war_create"
                 component={renderToggle}
                 className="form-field"
                 label="Notify on Discord when war is created"
                 style={{marginTop: 10}}
                 disabled={disableButtons || !currentWebhook} />

          <Field name="discord_notifications.war_cancel"
                 component={renderToggle}
                 className="form-field"
                 style={{marginTop: 10}}
                 label="Notify on Discord when war is cancelled"
                 disabled={disableButtons || !currentWebhook} />

          <Field name="discord_notifications.war_end"
                 component={renderToggle}
                 className="form-field"
                 style={{marginTop: 10}}
                 label="Post stats to Discord when war is finished"
                 disabled={disableButtons || !currentWebhook} />

          <Field name="discord_war_reminder"
                 component={renderRadioGroup}
                 className="form-field"
                 style={{
                   marginTop: 10,
                   flexDirection: "column",
                 }}
                 labelStyle={{
                   marginTop: 10,
                   color: 'rgb(66, 66, 66)',
                 }}
                 label="Post parties and pre-war reminder to discord">
            <RadioButton value={60}
                         label="60min before"
                         disabled={disableButtons || !currentWebhook} />
            <RadioButton value={30}
                         label="30min before"
                         disabled={disableButtons || !currentWebhook} />
            <RadioButton value={15}
                         label="15min before"
                         disabled={disableButtons || !currentWebhook} />
            <RadioButton value={-1}
                         label="Disabled"
                         disabled={disableButtons || !currentWebhook} />
          </Field>

        </CardText>
      </Card>
    )
  }
  renderForm() {
    const { handleSubmit, submitting } = this.props;
    const { regions } = this.props.user;

    return (
      <Form onSubmit={handleSubmit}>
        <Field name="region"
               component={renderSelectField}
               className="form-field"
               fullWidth={true}
               floatingLabelText="Region"
               hintText="Select a region"
               disabled={true}>
          {
            Object.keys(regions).map((key) => {
              return <MenuItem key={parseInt(key)} value={parseInt(key)} primaryText={regions[key].name} />;
            })
          }
        </Field>

        <Field name="description"
               component={renderTextField}
               className="form-field"
               fullWidth={true}
               floatingLabelText="Description"
               hintText="Text, Markdown, etc."
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
      discord_webhook,
      discord_notifications,
      discord_war_reminder,
      region,
    } = guild.selected;

    return {
      name,
      description,
      discord_id,
      discord_roles,
      discord_webhook,
      discord_notifications,
      discord_war_reminder,
      region,
    }
  }
}

const mapStateToProps = state => ({
  user: state.auth.user,
  initialValues: getInitialValues(state),
  guild: state.guild,
  profile: state.profile.selected,
  currentWebhook: formValueSelector('guild')(state, 'discord_webhook'),
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
