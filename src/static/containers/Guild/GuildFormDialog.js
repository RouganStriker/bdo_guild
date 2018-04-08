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

import { renderTextField, renderSelectField, renderToggle } from '../../components/Fields';
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
    const bot_invite_url = "https://discordapp.com/api/oauth2/authorize?client_id=336354195684851712&permissions=0&scope=bot";
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

          <Field name="discord_id"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Discord Server ID"
                 floatingLabelFixed={true}
                 hintText="Server Settings > Widget > Server ID"
                 disabled={submitting || read_only} />

          <Field name="discord_roles.2"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Officer Mapping"
                 floatingLabelFixed={true}
                 hintText="Discord Role Name"
                 disabled={submitting || read_only} />
          <Field name="discord_roles.3"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Quartermaster Mapping"
                 floatingLabelFixed={true}
                 hintText="Discord Role Name"
                 disabled={submitting || read_only} />
          <Field name="discord_roles.4"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Member Mapping"
                 floatingLabelFixed={true}
                 hintText="Discord Role Name"
                 disabled={submitting || read_only} />
          <Field name="discord_roles.5"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Mercenary Mapping"
                 floatingLabelFixed={true}
                 hintText="Discord Role Name"
                 disabled={submitting || read_only} />

          <Divider style={{marginTop: 15, marginBottom: 15}}/>
          <div>Notification Settings</div>

          <Field name="discord_webhook"
                 component={renderTextField}
                 className="form-field"
                 fullWidth={true}
                 floatingLabelText="Discord Webhook"
                 floatingLabelFixed={true}
                 hintText="Notifications are post via this hook"
                 disabled={submitting || read_only} />

          <Field name="discord_notifications.war_create"
                 component={renderToggle}
                 className="form-field"
                 label="Notify on Discord when war is created"
                 style={{marginTop: 10}}
                 disabled={submitting || read_only} />

          <Field name="discord_notifications.war_cancel"
                 component={renderToggle}
                 className="form-field"
                 style={{marginTop: 10}}
                 label="Notify on Discord when war is cancelled"
                 disabled={submitting || read_only} />

          <Field name="discord_notifications.war_start_warning"
                 component={renderToggle}
                 className="form-field"
                 style={{marginTop: 10}}
                 label="Post 15min warning to Discord along with war setup and details"
                 disabled={submitting || read_only} />

          <Field name="discord_notifications.war_end"
                 component={renderToggle}
                 className="form-field"
                 style={{marginTop: 10}}
                 label="Post stats to Discord when war is finished"
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
    } = guild.selected;

    return {
      name,
      description,
      discord_id,
      discord_roles,
      discord_webhook,
      discord_notifications,
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
