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

  fetchNodes(date) {
    const { dispatch } = this.props;

    // The UTC day is 1 day ahead of the day in the API endpoint because
    // the days are stored in terms of EST time.
    // 0 means Sunday in Javascript and 0 means Monday in Python.
    const convertDay = [5, 6, 0, 1, 2, 3, 4]
    dispatch(WarNodes.list({ params: { page_size: 50, war_day: convertDay[date.getUTCDay()] }}));
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
    const { currentDate, handleSubmit, submitting, nodes, war } = this.props;

    return (
      <Form onSubmit={handleSubmit}>
        <Field name="date"
               component={renderDateField}
               className="form-field"
               textFieldStyle={{width: "100%"}}
               floatingLabelFixed={true}
               floatingLabelText="Date"
               minDate={new Date()}
               formatDate={(date) => {
                return moment(date).tz(moment.tz.guess()).format('DD MMM YYYY HH:mm z')
               }}
               validate={[required]}
               onChange={this.handleDateChange.bind(this)}
               modifyDate={fixDate}
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
});

const formOptions = {
  form: "war",
  onSubmit: submitForm,
};

WarFormDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  guild_id: PropTypes.number,
};

WarFormDialog.defaultProps = {
  open: false,
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(WarFormDialog)
);
