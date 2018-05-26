import { gettext } from 'django-i18n';
import React, { Component } from 'react';
import { Field, clearSubmitErrors, getFormSubmitErrors, reduxForm, change, submit } from 'redux-form';
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
import AddIcon from 'material-ui/svg-icons/content/add';
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import ReactDataGrid,  { editors } from 'react-data-grid';
import { Editors, Formatters } from 'react-data-grid-addons';
import ReactDOM from 'react-dom';
import ConquestIcons from './images/conquest_icons.png';
const naturalSort = require("javascript-natural-sort");
naturalSort.insensitive = true;
const { DropDownEditor } = Editors;

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

import LoadingWidget from '../../components/LoadingWidget';
import { renderTextField, renderSelectField, renderRadioGroup, renderToggle } from '../../components/Fields';
import Form from '../../components/Form';
import FormError from '../../components/FormError';
import WarNodes from '../../services/content/nodes/service';
import WarService from '../../services/guilds/wars/service';
const _ = require('lodash');


class WarStatDialog extends React.Component {
  indexRows(rows) {
    return rows.map((row, index) => {
      return {
        ...row,
        index
      }
    });
  }

  getMemberChoices(members, rows) {
    // Filter out existing members from autocomplete
    const existingMembers = rows.map((row) => row.attendance.user_profile)
    const filteredMembers = members.filter((member) => existingMembers.indexOf(member.id) == -1)

    return filteredMembers
  }

  constructor(props, context) {
    super(props, context);
    const initialRows = this.indexRows(props.initialValues.stats);

    this.state = {
      rows: initialRows,
      memberChoices: this.getMemberChoices(props.membersAutocomplete, initialRows)
    };
  }

  getColumns() {
    const { showAttendanceToggle } = this.props;
    const { memberChoices } = this.state;

    const iconStyle = {
      objectFit: 'none',
      transform: 'scale(0.7, 0.7)',
      position: 'relative',
      top: -12,
      left: 0,
      width: 40,
      height: 40,
    }
    const NameEditor = <DropDownEditor options={memberChoices} />;

    const baseColumns = [
      {
        key: 'name',
        name: 'Name',
        editor: NameEditor,
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
      {
        key: 'action',
        name: '',
        formatter: this.deleteFormatter.bind(this),
        getRowMetaData: (rowMeta) => rowMeta,
        locked: true,
        editable: false,
        width: 60,
      },
    ];

    if (showAttendanceToggle) {
      return [
        {
          key: 'attended',
          name: 'Attended',
          formatter: this.attendanceFormatter.bind(this),
          getRowMetaData: (rowMeta) => rowMeta,
          locked: true,
          width: 90,
        },
        ...baseColumns
      ];
    } else {
      return baseColumns;
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.stats.length == nextProps.stats.length &&
        this.props.membersAutocomplete.length == nextProps.membersAutocomplete.length) {
      return;
    }

    const newRows = this.indexRows(nextProps.stats);

    this.state = {
      rows: newRows,
      memberChoices: this.getMemberChoices(nextProps.membersAutocomplete, newRows),
    };

    this.props.dispatch(change('warStat', 'stats', newRows));
  }

  attendanceFormatter({ value, dependentValues }) {
    const { index } = dependentValues;
    const params = {
      fromRow: index,
      toRow: index,
    }
    return <Toggle toggled={value}
                   onToggle={(e, attended) => this.handleGridRowsUpdated({ ...params, updated: { attended } })} />
  }

  deleteFormatter({ value, dependentValues }) {
    const { index } = dependentValues;

    return <IconButton children={<DeleteIcon />}
                       onClick={(e) => this.handleGridRowsRemove(index)}
                       tooltip="Remove" />
  }

  rowGetter = (i) => {
    return this.state.rows[i];
  };

  handleCancel() {
    const { onClose } = this.props;

    onClose && onClose()
  }

  handleGridRowsRemove(id) {
    let rows = this.state.rows.slice();
    rows.splice(id, 1);

    this.setState({ rows: this.indexRows(rows) });

    this.props.dispatch(change('warStat', 'stats', rows));
  }

  handleGridRowsAdd() {
    console.log(this.state.rows)
    const newIndex = this.state.rows.length > 0 && (_.last(this.state.rows).index + 1) || 0;
    const newRow = {
      'id': null,
      'name': '',
      'index': newIndex,
      'attendance': null,
      'user_profile': null,
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
    }
    const rows = [
      ...this.state.rows,
      newRow
    ]

    this.setState({ rows });

    this.props.dispatch(change('warStat', 'stats', rows));
  }

  handleGridRowsUpdated({ fromRow, toRow, updated }) {
    let rows = this.state.rows.slice();

    for (let i = fromRow; i <= toRow; i++) {
      rows[i] = {...rows[i], ...updated};
    }

    this.setState({ rows });

    this.props.dispatch(change('warStat', 'stats', rows));
  };

  renderStatTable() {
    const { showAddRow, submitErrors } = this.props;
    const minHeight = 35 * (this.state.rows.length + 3);

    return (
      <div>
        { submitErrors && submitErrors.stats && <FormError message={this.formatStatErrors()} /> }

        <ReactDataGrid
          enableCellSelect={true}
          columns={this.getColumns()}
          minWidth={1021}
          minHeight={minHeight}
          rowGetter={this.rowGetter}
          rowsCount={this.state.rows.length}
          onGridRowsUpdated={this.handleGridRowsUpdated.bind(this)} />

        {
          showAddRow &&
          <FlatButton label="Add Row"
                      labelPosition="before"
                      fullWidth={true}
                      onClick={this.handleGridRowsAdd.bind(this)}
                      icon={<AddIcon />} />
        }
      </div>
    )
  }

  formatStatErrors() {
    const { submitErrors: { stats } }  = this.props;
    const olStyle = {
      paddingLeft: 66,
      marginBottom: 16,
    }
    const liStyle = {
      listStyle: "disc",
      margin: "8px 0px",
    }

    return (
      <ol style={olStyle}>
        {
          stats.map((error, index) => {
            if (!Object.keys(error).length) {
              // No errors
              return;
            }

            const errorMessage = Object.keys(error).map((field) => {
              if (field == '__nonfield__') {
                return <li style={liStyle}>{error[field]}</li>;
              }
              return <li style={liStyle}>{field}: {error[field]}</li>
            });

            return (
              <li style={liStyle}>
                Row {index} :
                <ol style={{paddingLeft: 22}}>
                  {errorMessage}
                </ol>
              </li>
            );
          })
        }
      </ol>
    );
  }

  renderForm() {
    const {
      handleSubmit,
      isLoading,
      nodes,
      submitting,
    } = this.props;

    if (isLoading) {
      return <LoadingWidget />
    }

    return (
      <Form onSubmit={handleSubmit}>
        <Field name="node"
               component={renderSelectField}
               className="form-field"
               fullWidth={true}
               floatingLabelFixed={true}
               floatingLabelText="War Node"
               hintText="Select Node"
               disabled={submitting}
               maxHeight={300}>
          {
            nodes.map(node => {
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
      isLoading,
      onClose,
      submitting,
      title,
    } = this.props;

    const actions = [
      <FlatButton label="Cancel"
                  onClick={onClose}
                  disabled={submitting || isLoading}
      />,
      <FlatButton label="Submit"
                  primary={true}
                  onClick={() => this.props.dispatch(submit('warStat'))}
                  disabled={submitting || isLoading}
      />,
    ];

    return (
      <Dialog actions={actions}
              modal={true}
              open={true}
              autoScrollBodyContent={true}
              onRequestClose={this.handleCancel.bind(this)}
              contentStyle={{width: '100%', minWidth: 1080, height: window.innerHeight}}
              title={title}
      >
        { this.renderForm() }
      </Dialog>
    )
  }
}

function submitForm(values, dispatch, props) {
  const { guild_id, onClose, dirty, war, initialValues, onConfirm, war_id } = props;
  const dirtyValues = {}

  if (initialValues.node != values.node) {
    dirtyValues.node = values.node;
  }
  if (initialValues.note != values.note) {
    dirtyValues.note = values.note;
  }
  if (initialValues.outcome != values.outcome) {
    dirtyValues.outcome = values.outcome;
  }
  if (!_.isEqual(initialValues.stats, values.stats)) {
    dirtyValues.stats = values.stats;
  }

  if (!dirtyValues) {
    return onConfirm && onConfirm()
  }

  clearSubmitErrors('warStat');

  dispatch(WarService.updateWar({
    id: war_id,
    context: { guild_id },
    payload: values,
    form: 'warStat',
    onSuccess: () => onConfirm && onConfirm(),
  }))
}

const mapStateToProps = (state, props) => ({
  initialValues: {
    "node": props.node,
    "note": props.note,
    "outcome": props.outcome,
    "stats": props.stats,
  },
  submitErrors: getFormSubmitErrors('warStat')(state),
});

const formOptions = {
  form: "warStat",
  onSubmit: submitForm,
};

WarStatDialog.propTypes = {
  isLoading: PropTypes.bool,
  membersAutocomplete: PropTypes.array,
  node: PropTypes.number,
  nodes: PropTypes.array,
  note: PropTypes.string,
  onConfirm: PropTypes.func,
  onClose: PropTypes.func,
  outcome: PropTypes.number,
  showAttendanceToggle: PropTypes.bool,
  showAddRow: PropTypes.bool,
  stats: PropTypes.array,
  title: PropTypes.string,
  war_id: PropTypes.number,
};

WarStatDialog.defaultProps = {
  showAttendanceToggle: false,
  showAddRow: false,
}

export default connect(mapStateToProps)(
  reduxForm(formOptions)(WarStatDialog)
);
