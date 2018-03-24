import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import EditIcon from 'material-ui/svg-icons/image/edit';
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import SettingsIcon from 'material-ui/svg-icons/action/settings';
import TextField from 'material-ui/TextField';
import { Grid, Row, Col } from 'react-bootstrap';
import { MuiThemeProvider } from 'material-ui/styles';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import LoadingWidget from '../../components/LoadingWidget';
import MemberSelectField from './MemberSelectField';

class TeamWidget extends React.Component {
  constructor() {
    super();

    this.state = {
      hoverCell: null,
    }
  }

  render() {
    const {
      available_roles,
      canEdit,
      bodyStyle,
      columnStyle,
      members,
      handleDelete,
      handleEdit,
      headerStyle,
      isLoading,
      name,
      onMemberSelected,
      tableProps,
      type,
      values,   // 2D array [[{id: 1, label: Label, value: val}]]
    } = this.props;

    const loadingIndicator = <LoadingWidget style={{padding: 0}} type='circle' />
    const actionMenu = (
      <IconMenu iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
                anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                targetOrigin={{horizontal: 'right', vertical: 'top'}}
      >
        <MenuItem disabled={isLoading} primaryText="Edit" onClick={handleEdit} />
        <MenuItem disabled={isLoading} primaryText="Delete" onClick={handleDelete} />
      </IconMenu>
    )

    const available_members = members.filter((member) => (type === 'call_sign' && !member.call_sign) || (type === 'team' && !member.team));
    const muiTheme = getMuiTheme({
      tableRow: {
        hoverColor: "inherit",
      }
    });

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <Table selectable={false}
               onCellHover={(row, col) => this.setState({hoverCell: { row, col }})}
               onCellHoverExit={() => this.setState({hoverCell: null})}
               {...tableProps}>
          <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
            <TableRow style={headerStyle}>
              <TableHeaderColumn colSpan="4" style={{paddingRight: 0}}>
                <h5 className="truncate-text">{name}</h5>
              </TableHeaderColumn>
              <TableHeaderColumn style={{ width: 48, paddingLeft: 0, paddingRight: 0 }}>
                { canEdit && actionMenu }
              </TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false} style={bodyStyle}>
            {
              values.map((row, rowIndex) => {
                return (
                  <TableRow key={rowIndex}>
                    {
                      row && row.map((column, colIndex) => {
                        const {
                          id,
                          role_id,
                          attendee_id,
                        } = column;
                        let role = null;
                        let label = `${name}-${id}`

                        if (role_id != null) {
                          role = available_roles.find((role) => role.id === role_id)
                          label = `${role.name}-${id}`
                        }

                        // Construct a new members list if there is a member selected for that slot
                        const selectedMember = attendee_id !== null && members.find((member) => member.id === attendee_id) || null

                        return (
                          <TableRowColumn key={id}
                                          style={{paddingLeft: 12, paddingRight: 12, ...columnStyle}}>
                            <MemberSelectField canEdit={canEdit}
                                               label={label}
                                               initiallySelected={attendee_id}
                                               isLoading={isLoading}
                                               members={selectedMember && [...available_members, selectedMember] || available_members}
                                               role={role}
                                               onMemberSelected={(member) => onMemberSelected && onMemberSelected(id, member)} />
                          </TableRowColumn>
                        );
                      })
                    }
                  </TableRow>
                );
              })
            }
          </TableBody>
        </Table>
      </MuiThemeProvider>
    );
  }
}

TeamWidget.propTypes = {
  available_roles: PropTypes.array,
  canEdit: PropTypes.bool,
  name: PropTypes.string.isRequired,
  tableProps: PropTypes.object,
  columnStyle: PropTypes.object,
  headerStyle: PropTypes.object,
  bodyStyle: PropTypes.object,
  isLoading: PropTypes.bool,
  handleEdit: PropTypes.func,
  handleDelete: PropTypes.func,
  onMemberSelected: PropTypes.func,
  values: PropTypes.array,   // 2D array [[{id: 1, label: Label, value: val}]]
  members: PropTypes.array,
  type: PropTypes.string,
};

TeamWidget.defaultProps = {
  canEdit: true,
  columnStyle: {border: "1px solid rgb(224, 224, 224)"},
  members: [],
  isLoading: false,
  values: [],
  type: 'team', // team or call_sign
};

export default TeamWidget;
