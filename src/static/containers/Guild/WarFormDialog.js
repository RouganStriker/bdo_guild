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
const moment = require('moment-timezone')

import { required } from '../../utils/validations';
import { renderTextField, renderCheckbox, renderSelectField, renderRadioGroup, renderDateField } from '../../components/Fields';
import Admonition from '../../components/Admonition';
import Form from '../../components/Form';
import WarNodes from '../../services/content/nodes/service';
import WarService from '../../services/guilds/wars/service';


function fixDate(dateObj) {
  // Convert back to UTC
    if (!dateObj) {
      return null;
    }
    const warDate = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 2, 0, 0, 0))
    if (dateObj.getTime() > warDate.getTime()) {
      // Bump to next day
      warDate.setDate(warDate.getDate() + 1);
    }

    return warDate
}

class WarFormDialog extends React.Component {

  componentDidMount() {
    const { initialValues: { date } } = this.props;

    date && this.fetchNodes(date);
  }

  handleCancel() {
    const { onClose } = this.props;

    if (onClose) {
      onClose();
    }
  }

  getWarDayFromDate(date) {
    // The UTC day is 1 day ahead of the day in the API endpoint because
    // the days are stored in terms of EST time.
    // 0 means Sunday in Javascript and 0 means Monday in Python.
    const { guild_region, regions } = this.props;
    const region = regions[guild_region];
    const convertDay = [6, 0, 1, 2, 3, 4, 5]
    const warDay = moment(date).tz(region.timezone).day();

    return convertDay[warDay];
  }

  fetchNodes(date) {
    const { dispatch } = this.props;

    dispatch(WarNodes.list({ params: { page_size: 50, war_day: this.getWarDayFromDate(date) }}));
  }

  handleDateChange(evt, date) {
    const { currentDate, dispatch } = this.props;

    if (currentDate !== null && new Date(currentDate).getDay() === date.getDay()) {
      // No need to re-fetching nodes
      return;
    }

    // Clear value on change
    dispatch(change('war', 'node', null));
    this.fetchNodes(date);
  }

  renderForm() {
    const {
      attendanceEstimate,
      currentDate,
      guild_region,
      handleSubmit,
      regions,
      submitting,
      nodes,
      war
    } = this.props;
    const war_day = currentDate && this.getWarDayFromDate(currentDate);
    const region = regions[guild_region];
    let estimate = null;

    if (war_day != null && attendanceEstimate != null) {
      estimate = attendanceEstimate[war_day.toString()];
    }

    const admonitionContent = !war.selected && estimate != null && `There are ${estimate} members auto signed up for this day.`
    const warStartTime = moment.utc(region.node_war_start_time, 'HH:mm:ss').tz(region.timezone)
    const initialDate = warStartTime < new Date() && warStartTime.add(1, 'days') || warStartTime;
    const minStartDate = new Date(initialDate.toISOString())
    const tzHasAbbreviation = !warStartTime.zoneAbbr().includes("+") && !warStartTime.zoneAbbr().includes("-");
    const dateFormat = tzHasAbbreviation && 'DD MMM YYYY HH:mm z' || 'DD MMM YYYY HH:mm ZZ';

    return (
      <Form onSubmit={handleSubmit}>
        <Admonition type="info"
                    content={admonitionContent} />

        <Field name="date"
               component={renderDateField}
               className="form-field"
               defaultDate={minStartDate}
               textFieldStyle={{width: "100%"}}
               floatingLabelFixed={true}
               floatingLabelText="Date"
               minDate={minStartDate}
               formatDate={(date) => {
                 // Fix the time
                 const fixDate = moment(date).tz(region.timezone);
                 fixDate.hours(warStartTime.hours());
                 fixDate.minutes(warStartTime.minutes())
                 fixDate.seconds(warStartTime.seconds())

                 return fixDate.format(dateFormat);
               }}
               validate={[required]}
               onChange={this.handleDateChange.bind(this)}
               modifyDate={(date) => {
                 // Fix the time
                 const fixDate = moment(date).tz(region.timezone);
                 fixDate.hours(warStartTime.hours());
                 fixDate.minutes(warStartTime.minutes())
                 fixDate.seconds(warStartTime.seconds())

                 return new Date(fixDate.toISOString());
               }}
               disabled={submitting || war.selected} />
        <Field name="node"
               component={renderSelectField}
               className="form-field"
               fullWidth={true}
               floatingLabelFixed={true}
               floatingLabelText="War Node"
               hintText="Select Node"
               disabled={currentDate === null || nodes.isLoading || submitting}
               maxHeight={300}>
          {
            nodes.items.map(node => {
              const label = node.tier < 4 && `T${node.tier}: ${node.name}` || `${node.name} Territory`
              return <MenuItem key={node.id} value={node.id} primaryText={label} />
            })
          }
        </Field>
        <Field name="note"
               component={renderTextField}
               className="form-field"
               fullWidth={true}
               floatingLabelFixed={true}
               floatingLabelText="Note"
               hintText="Pre war notes"
               multiLine={true}
               disabled={submitting} />
        {
          !war.selected &&
          <Field name="use_last_setup"
                 component={renderCheckbox}
                 className="form-field"
                 defaultChecked={true}
                 label={"Reuse setup from last war"}
                 disabled={submitting} />
        }
      </Form>
    );
  }

  render() {
    return this.renderContent();
  }

  handleDelete() {
    const { dispatch, guild_id, handleDeleteSuccess, war } = this.props;

    dispatch(WarService.destroy({ id: war.selected.id, context: { guild_id }, onSuccess: handleDeleteSuccess }))
  }

  renderContent() {
    const { dirty, open, submitting, war } = this.props;
    const title = war.selected && "Edit War" || "Create War";
    const actions = [
      <FlatButton
        label="Cancel"
        onClick={this.handleCancel.bind(this)}
        disabled={submitting}
      />,
      <FlatButton
        label={war.selected && "Save" || "Create"}
        primary={true}
        onClick={() => this.props.dispatch(submit('war'))}
        disabled={submitting}
      />,
    ];

    if (war.selected) {
      actions.push(
        <FlatButton
          label="Delete"
          secondary={true}
          onClick={this.handleDelete.bind(this)}
          disabled={submitting}
          style={{float: "left"}}
        />,
      )
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
  const { handleSubmitSuccess, guild_id, onClose, dirty, war } = props;

  if (war.selected) {
    dispatch(WarService.updateSelected({ payload: values, context: { guild_id }, params: { expand: 'node' }, form: 'war', onSuccess: handleSubmitSuccess }))
  } else {
    dispatch(WarService.create({ payload: values, context: { guild_id }, form: 'war', onSuccess: handleSubmitSuccess }))
  }
}

const getInitialValues = (state) => {
  const { war } = state;

  if (war.selected) {
    const {
      date,
      node,
      note
    } = war.selected;

    return {
      date: new Date(date),
      node: node && node.id || null,
      note,
    }
  }

  return {
    date: fixDate(new Date()),
    node: null,
    note: '',
    use_last_setup: true,
  }
}

const selector = formValueSelector('war')

const mapStateToProps = state => ({
  auth: state.auth,
  nodes: state.warNodes,
  initialValues: getInitialValues(state),
  currentDate: selector(state, 'date') || null,
  war: state.war,
  regions: state.auth.user.regions,
});

const formOptions = {
  form: "war",
  onSubmit: submitForm,
};

WarFormDialog.propTypes = {
  attendanceEstimate: PropTypes.object,
  open: PropTypes.bool,
  title: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  guild_id: PropTypes.number,
  guild_region: PropTypes.number,
};

WarFormDialog.defaultProps = {
  open: false,
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(WarFormDialog)
);
