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
import Toggle from 'material-ui/Toggle';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import Dialog from 'material-ui/Dialog';
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import ReactDataGrid,  { editors } from 'react-data-grid';
import ReactDOM from 'react-dom';
import ConquestIcons from './images/conquest_icons.png';
const naturalSort = require("javascript-natural-sort");
naturalSort.insensitive = true;

const moment = require('moment-timezone')
import {
  Table,
  TableBody,
  TableFooter,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

import { renderTextField, renderChipField, renderSelectField, renderRadioGroup, renderToggle, renderDateField } from '../../components/Fields';
import Form from '../../components/Form';
import WarNodes from '../../services/content/nodes/service';
import WarService from '../../services/guilds/wars/service';
const _ = require('lodash');


class WarStatDialog extends React.Component {

  constructor(props, context) {
    super(props, context);

    const iconStyle = {
      objectFit: 'none',
      transform: 'scale(0.7, 0.7)',
      position: 'relative',
      top: -12,
      left: 0,
      width: 40,
      height: 40,
    }

    this._columns = [
      {
        key: 'attended',
        name: 'Attended',
        formatter: this.attendanceFormatter.bind(this),
        getRowMetaData: (rowMeta) => rowMeta,
        locked: true,
        width: 90,
      },
      {
        key: 'name',
        name: 'Name',
        locked: true,
        width: 250,
      },
      {
        key: 'command_post',
        name: 'Command Post',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '0 0'}} />,
        width: 60,
      },
      {
        key: 'fort',
        name: 'Fort',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-61px 0'}} />,
        width: 60,
      },
      {
        key: 'gate',
        name: 'Gate',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-126px 0'}} />,
        width: 60,
      },
      {
        key: 'help',
        name: 'Help',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-193px 0'}} />,
        width: 60,
      },
      {
        key: 'mount',
        name: 'Mount',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-253px 0'}} />,
        width: 60,
      },
      {
        key: 'placed_objects',
        name: 'Placed Objects',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-319px 0'}} />,
        width: 60,
      },
      {
        key: 'guild_master',
        name: 'Guild Master',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-384px 0'}} />,
        width: 60,
      },
      {
        key: 'officer',
        name: 'Officer',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-448px 0'}} />,
        width: 60,
      },
      {
        key: 'member',
        name: 'Member',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-512px 0'}} />,
        width: 60,
      },
      {
        key: 'death',
        name: 'Death',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-575px 0'}} />,
        width: 60,
      },
      {
        key: 'siege_weapons',
        name: 'Siege Weapons',
        editable: true,
        headerRenderer: () => <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-635px 0'}} />,
        width: 60,
      },
    ];

    this.state = {
      rows: props.initialValues.stats,
    };
  }

  attendanceFormatter({ value, dependentValues }) {
    const { id } = dependentValues;
    const params = {
      fromRow: id,
      toRow: id,
    }
    return <Toggle toggled={value}
                   onToggle={(e, attended) => this.handleGridRowsUpdated({ ...params, updated: { attended } })} />
  }

  rowGetter = (i) => {
    return this.state.rows[i];
  };

  handleCancel() {
    const { onClose } = this.props;

    onClose && onClose()
  }

  handleGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    let rows = this.state.rows.slice();

    for (let i = fromRow; i <= toRow; i++) {
      rows[i] = {...rows[i], ...updated};
    }

    this.setState({ rows });

    this.props.dispatch(change('warStat', 'stats', rows));
  };

  renderStatTable() {
    const minHeight = Math.max(79, 44 + (35 * Math.min(5, this.state.rows.length)));

    return (
      <ReactDataGrid
        enableCellSelect={true}
        columns={this._columns}
        minWidth={1021}
        minHeight={minHeight}
        rowGetter={this.rowGetter}
        rowsCount={this.state.rows.length}
        onGridRowsUpdated={this.handleGridRowsUpdated.bind(this)} />
    )
  }

  renderForm() {
    const { handleSubmit, submitting } = this.props;

    return (
      <Form onSubmit={handleSubmit}>
        <label className="form-label">Outcome</label>
        <Field name="outcome"
               component={renderRadioGroup}
               className="form-field"
               disabled={submitting}>
          <RadioButton value={0}
                       label="Win" />
          <RadioButton value={1}
                       label="Loss" />
          <RadioButton value={2}
                       label="Stalemate" />
        </Field>

        <label className="form-label">War Scores</label>
        { this.renderStatTable() }
      </Form>
    )
  }

  render() {
    const {
      onClose,
      open,
      submitting,
    } = this.props;

    const actions = [
      <FlatButton
        label="Cancel"
        onClick={this.handleCancel.bind(this)}
        disabled={submitting}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        onClick={() => this.props.dispatch(submit('warStat'))}
        disabled={submitting}
      />,
    ];

    return (
      <Dialog actions={actions}
              bodyStyle={{overflowY: 'scroll', overflowX: 'hidden'}}
              modal={false}
              open={open}
              onRequestClose={this.handleCancel.bind(this)}
              contentStyle={{width: '100%', minWidth: 1080, height: '80%'}}
              title={'Finish War'}
      >
        { this.renderForm() }
      </Dialog>
    )
  }
}

function submitForm(values, dispatch, props) {
  const { guild_id, onClose, dirty, war, handleSubmitSuccess } = props;

  dispatch(WarService.finish({
    id: war.selected.id,
    context: { guild_id },
    payload: values,
    form: 'warStat',
    onSuccess: handleSubmitSuccess,
  }))
}

function generateRows(attendance) {
  const sortedAttendance = attendance.sort((a, b) => naturalSort(a.name, b.name));

  return sortedAttendance.map((attendee, index) => {
    return {
      'attended': !!attendee.preferred_roles,
      'name': attendee.name,
      'id': index,
      'attendance': attendee.id,
      'user_profile': attendee.profile_id,
      'command_post': 0,
      'fort': 0,
      'gate': 0,
      'help': 0,
      'mount': 0,
      'placed_objects': 0,
      'guild_master': 0,
      'officer': 0,
      'member': 0,
      'death': 0,
      'siege_weapons': 0,
    };
  })
}

const selector = formValueSelector('war')

const mapStateToProps = (state, props) => ({
  guild: state.guild,
  war: state.war,
  initialValues: {
    "outcome": 0,
    "stats": generateRows(props.attendance),
  }
});

const formOptions = {
  form: "warStat",
  onSubmit: submitForm,
};

WarStatDialog.propTypes = {
  attendance: PropTypes.array,
  open: PropTypes.bool,
  title: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  guild_id: PropTypes.number,
};

WarStatDialog.defaultProps = {
  open: true,
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(WarStatDialog)
);
