import { gettext } from 'django-i18n';
import React, { Component } from 'react';
import { Field, reduxForm, change, submit, formValueSelector } from 'redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import SelectField from 'material-ui/SelectField'
import Dialog from 'material-ui/Dialog';
import { RadioButton } from 'material-ui/RadioButton'
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import {Card, CardHeader, CardText} from 'material-ui/Card';
const diff = require('object-diff');

import { renderTextField, renderSelectField, renderRadioGroup } from '../../components/Fields';
import Form from '../../components/Form';
import WarService from '../../services/guilds/wars/service';
import { WarTeamService } from '../../services';
import LoadingWidget from '../../components/LoadingWidget';

class TeamFormDialog extends React.Component {
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

  renderSlotSection({ input, meta: { touched, error }, ...custom }) {
    const {
      available_roles,
      disabled,
      currentTeamType,
    } = custom

    const columns = Array.from(
      // Platoon has 20 slots, Party has 5
      new Array(currentTeamType === 0? 4 : 1),
      (x,i) => i
    );
    const range = Array.from(new Array(5), (x,i) => i + 1);
    const roleItems = available_roles.map((role) => {
      return <MenuItem key={role.id} value={role.id} primaryText={role.name} />
    })
    const handleSlotChange = (index, value) => {
      const newValue = { ...input.value };
      newValue[index] = value;

      input.onChange(newValue)
    }

    return (
      <Card initiallyExpanded={false}
            style={{boxShadow: null}}>
        <CardHeader
          title="Advanced Slot Customizations"
          actAsExpander={true}
          showExpandableButton={true}
          style={{paddingLeft: 0, paddingRight: 0}}
        />
        <CardText expandable={true}
                  style={{paddingLeft: 0, paddingRight: 0, paddingTop: 0}}>
          <Table selectable={false}>
            <TableBody displayRowCheckbox={false}>
              {
                range.map((row_index) => {
                  return (
                    <TableRow key={`row-${row_index}`}>
                      {
                        columns.map((col_index) => {
                          const index = row_index + (5 * col_index);
                          return (
                            <TableRowColumn key={`col-${index}`} style={{paddingLeft: 0}}>
                              <SelectField hintText="Default Role"
                                           floatingLabelFixed={true}
                                           floatingLabelText={`Slot ${index}`}
                                           style={{
                                             verticalAlign: "bottom",
                                             width: "100%"
                                           }}
                                           onChange={(e, key, role_id) => handleSlotChange(index, role_id)}
                                           value={input.value[index] || null}
                                           disabled={disabled}
                                           underlineStyle={{display: "none" }}>
                                { roleItems }
                              </SelectField>
                            </TableRowColumn>
                          )
                        })
                      }
                    </TableRow>
                  );
                })
              }
            </TableBody>
          </Table>
        </CardText>
      </Card>
    )
  }

  renderForm() {
    const { available_roles, currentTeamType, handleSubmit, submitting } = this.props;

    return (
      <Form onSubmit={handleSubmit}>
        <label className="form-label">Team Type</label>
        <Field name="type"
               component={renderRadioGroup}
               defaultSelected={1}
               className="form-field"
               onChange={() => this.props.dispatch(change('team', 'slot_setup', {}))}
               disabled={submitting}>
          <RadioButton value={0}
                       label="Platoon" />
          <RadioButton value={1}
                       label="Party" />
        </Field>
        <Field name="name"
               component={renderTextField}
               className="form-field"
               style={{maxWidth: 300, display: "block"}}
               floatingLabelFixed={true}
               floatingLabelText="Name"
               hintText="Enter team name"
               disabled={submitting} />
        <Field name={"default_role"}
             component={renderSelectField}
             className="form-field"
             floatingLabelFixed={true}
             floatingLabelText="Default Role  "
             hintText="Select Default Role"
             style={{maxWidth: 300}}
             disabled={submitting}>
          {
            available_roles.map((role) => {
              return <MenuItem key={role.id} value={role.id} primaryText={role.name} />
            })
          }
        </Field>

        <Divider style={{marginTop: 16}}/>

        <Field name={"slot_setup"}
               component={this.renderSlotSection}
               className="form-field"
               available_roles={available_roles}
               currentTeamType={currentTeamType}
               disabled={submitting} />
      </Form>
    );
  }

  render() {
    return this.renderContent();
  }

  renderContent() {
    const { creating, open, title, submitting } = this.props;
    const dialog_title = title || (creating && gettext("Add Team")) || gettext("Edit Team")

    const actions = [
      <FlatButton
        label="Cancel"
        onClick={this.handleCancel.bind(this)}
        disabled={submitting}
      />,
      <FlatButton
        label="Save"
        primary={true}
        onClick={() => this.props.dispatch(submit('team'))}
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
        contentStyle={{maxWidth: 700}}
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
    dispatch(WarTeamService.create({ payload: values, context: { guild_id, war_id }, form: 'team' }))
  } else {
    const changes = diff(initialValues, values);
    dispatch(WarTeamService.update({ id: initialValues.id, payload: changes, context: { guild_id, war_id }, form: 'team' }))
  }
}

const selector = formValueSelector('team')

const mapStateToProps = state => ({
  currentTeamType: selector(state, 'type'),
  creating: state.war_team.selected === null,
});

const formOptions = {
  form: "team",
  onSubmit: submitForm,
};

TeamFormDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  initialValues: PropTypes.object,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  available_roles: PropTypes.array,
  war_id: PropTypes.number,
  guild_id: PropTypes.number,
};

TeamFormDialog.defaultProps = {
  open: true,
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(TeamFormDialog)
);
