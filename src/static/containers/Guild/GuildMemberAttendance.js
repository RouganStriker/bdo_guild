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
const _ = require('lodash');

import Time from '../../components/Time';
import LoadingWidget from '../../components/LoadingWidget';
import {
  WarService,
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

    dispatch(WarService.list({ context: { guild_id }, params: { page_size: 6 }}))
    dispatch(MemberService.clearLoaded());
    dispatch(MemberService.list({ context: { guild_id }, params: { include: "attendance", page_size: 100 }}))
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
                      } else if (attendance.is_attending === 0) {
                        display = this.renderAttended;
                      } else if (attendance.is_attending === 1) {
                        display = this.renderUnavailable;
                      } else {
                        display = this.renderMissed;
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
  };
};

export default connect(mapStateToProps)(GuildMemberAttendance)