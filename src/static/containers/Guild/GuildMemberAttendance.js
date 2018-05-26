import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import Paper from 'material-ui/Paper';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import AttendedIcon from 'material-ui/svg-icons/action/check-circle';
import UnavailableIcon from 'material-ui/svg-icons/content/remove-circle';
import MissedIcon from 'material-ui/svg-icons/navigation/cancel';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
const _ = require('lodash');
import { toast } from 'react-toastify';

import Time from '../../components/Time';
import LoadingWidget from '../../components/LoadingWidget';
import {
  WarService,
  WarAttendanceService,
  MemberService,
} from '../../services';


class GuildMemberAttendance extends React.Component {
  constructor(props) {
    super(props);

    this.renderAttended = <AttendedIcon color="rgba(180,228,191,1)" />
    this.renderUnavailable = <UnavailableIcon color="rgba(253,194,139,1)" />
    this.renderMissed = <MissedIcon color="rgba(251,166,138,1)" />
    this.columnStyle = {
      textAlign: "center",
      width: 120,
    }
    this.nameStyle = {
      width: 220
    }
  }

  componentWillMount() {
    const { dispatch, guild_id, members, war } = this.props;

    dispatch(WarService.list({ context: { guild_id }, params: { page_size: 6, outcome__isnull: "False" }}))
    dispatch(MemberService.clearLoaded());
    dispatch(MemberService.list({
      context: { guild_id },
      params: {
        include: "attendance",
        page_size: 100,
      }
    }))
  }

  memberHasPermission(permission) {
    const { profile, guild_id, role_permissions } = this.props;

    if (!profile) {
      return false;
    }

    const guild_role = profile.membership.find((membership) => membership.guild.id == parseInt(guild_id)).role.id;
    const guild_permissions = role_permissions[guild_role]

    return guild_permissions.includes(permission);
  }

  onAttendanceChangeSuccess() {
    const { dispatch, guild_id } = this.props;

    dispatch(MemberService.list({
      context: { guild_id },
      params: {
        include: "attendance",
        page_size: 100,
      }
    }))

    toast.success("Attendance has been updated")
  }

  handleAttendanceChange(attendance, war_id, new_status) {
    const { dispatch, guild_id } = this.props;

    dispatch(WarAttendanceService.update({
      id: attendance.id,
      context: { guild_id, war_id },
      payload: { is_attending: new_status },
      onSuccess: this.onAttendanceChangeSuccess.bind(this),
    }));
  }

  renderAttendanceToggle(attendance, war_id) {
    const { war_attendance } = this.props;
    const { id, is_attending } = attendance;
    const icon = ((is_attending == 0 || is_attending == 4) && this.renderAttended) ||
                 (is_attending == 1 && this.renderUnavailable) ||
                 this.renderMissed;

    if (!this.memberHasPermission('change_member_attendance')) {
      return icon;
    }

    return (
      <IconMenu iconButtonElement={<IconButton disabled={war_attendance.isLoading}>{icon}</IconButton>}
                value={is_attending}
                onChange={(e, newValue) => this.handleAttendanceChange(attendance, war_id, newValue)}>
        <MenuItem primaryText="Attended"
                  value={0} />
        <MenuItem primaryText="Unavailable"
                  value={1} />
        <MenuItem primaryText="Missed"
                  value={3} />
        <MenuItem primaryText="Late"
                  value={4} />
        <MenuItem primaryText="Reneged"
                  value={5} />
      </IconMenu>
    );
  }

  render() {
    const { members, war } = this.props;

    if (!war.isLoaded || !members.isLoaded || members.items && !members.items[0].attendance) {
      return <LoadingWidget />
    }

    let columnDates = war.items.map((item) => item.date)
    if (columnDates.length < 6) {
      const placeholders = _.fill(Array(6 - columnDates.length), '-')
      columnDates = [...columnDates, ...placeholders]
    }

    const dateWarMapping = war.items.reduce((current, war) => {
      current[war.date] = war.id;
      return current;
    }, {});

    return (
      <Card style={{padding: 20}}>
        <Table selectable={false}
               bodyStyle={{overflowX: 'none', overflowY: 'none'}}>
          <TableHeader adjustForCheckbox={false}
                       displaySelectAll={false}>
            <TableRow>
              <TableHeaderColumn style={this.nameStyle}>Name</TableHeaderColumn>
              {
                columnDates.map((date, i) => {
                  return (
                    <TableHeaderColumn key={i} style={this.columnStyle}>
                      { date !== '-' && <Time format='YYYY/MM/DD'>{new Date(date)}</Time> || date}
                    </TableHeaderColumn>
                  )
                })
              }
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            {
              members.items.map((member) => (
                <TableRow key={member.id}>
                  <TableRowColumn style={this.nameStyle}>{member.name}</TableRowColumn>
                  {
                    columnDates.map((date, i) => {
                      const attendance = member.attendance.find((item) => item.date === date);
                      let display = null;

                      if (!attendance) {
                        display = '-'
                      } else {
                        display = this.renderAttendanceToggle(attendance, dateWarMapping[date])
                      }

                      return (
                        <TableRowColumn key={i} style={this.columnStyle}>
                          {display}
                        </TableRowColumn>
                      )
                    })
                  }
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </Card>
    )
  }
}

const mapStateToProps = (state) => {
  return {
      members: state.members,
      war: state.war,
      role_permissions: state.auth.user.role_permissions,
      profile: state.profile.selected,
      war_attendance: state.warAttendance,
  };
};

export default connect(mapStateToProps)(GuildMemberAttendance)