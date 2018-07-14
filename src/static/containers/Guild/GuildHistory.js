import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import {Timeline, TimelineBlip, TimelineEvent} from 'react-event-timeline'
import { connect } from 'react-redux';
import FontIcon from 'material-ui/FontIcon';
import Dialog from 'material-ui/Dialog';
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import StatIcon from 'material-ui/svg-icons/social/poll';
import EditIcon from 'material-ui/svg-icons/image/edit';
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import GroupIcon from 'material-ui/svg-icons/social/group';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Picker from 'react-month-picker';
require('react-month-picker/css/month-picker.css')
import { toast } from 'react-toastify';

import EmptyState from '../../components/EmptyState';
import Time from '../../components/Time';
import LoadingWidget from '../../components/LoadingWidget';
import Tooltip from '../../components/Tooltip';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  WarNodesService,
  WarService,
  WarStatsService,
  MemberService,
} from '../../services';
import WarStatTable from './WarStatTable';
import WarStatEditDialog from './WarStatEditDialog';
import ConquestIcons from './images/conquest_icons.png';
import FortIcon from './images/castle.png';
import KillIcon from './images/sword-cross.png';
import DeathIcon from './images/skull.png';
import HelpIcon from './images/human-greeting.png';
const moment = require('moment-timezone')


class GuildHistory extends React.Component {
  constructor(props) {
    super(props);

    this.winStyle = {
      bubbleStyle: {
        backgroundColor: "rgb(218, 241, 222)"
      },
      icon: <i>⚔️</i>,
      iconColor: "rgb(54, 150, 76)",
    }
    this.tieStyle = {
      bubbleStyle: {
        backgroundColor: "rgb(254, 230, 205)"
      },
      icon: <i>⚔️</i>,
      iconColor: "rgb(250, 123, 5)",
    }
    this.lossStyle = {
      bubbleStyle: {
        backgroundColor: "rgb(255, 204, 205)"
      },
      icon: <i>⚔️</i>,
      iconColor: "rgb(179, 0, 3)",
    }
    this.unknownStyle = {
      bubbleStyle: {
        backgroundColor: "rgb(214, 214, 214)"
      },
      icon: <i>?</i>,
      iconColor: "rgb(124, 124, 124)",
    }
    this.outcomeMappings = [this.winStyle, this.lossStyle, this.tieStyle];

    const today = new Date();

    this.state = {
      date: {
        year: today.getFullYear(),
        month: today.getMonth() + 1
      },
      maxDate: {
        year: today.getFullYear(),
        month: today.getMonth() + 1
      },
      showStats: false,
      editStat: false,
      selectedWar: null,
      showDelete: false,
    }
  }

  fixDate(date) {
    const { guild_region_id, regions } = this.props;
    const region = regions[guild_region_id];
    const warStartTime = moment.utc(region.node_war_start_time, 'HH:mm:ss').tz(region.timezone);

    // Fix the time
    const fixDate = moment(date).tz(region.timezone);
    fixDate.hours(warStartTime.hours());
    fixDate.minutes(warStartTime.minutes())
    fixDate.seconds(warStartTime.seconds())

    return new Date(fixDate.toISOString());
  }

  getWarDayFromDate(date) {
    // The UTC day is 1 day ahead of the day in the API endpoint because
    // the days are stored in terms of EST time.
    // 0 means Sunday in Javascript and 0 means Monday in Python.
    const { guild_region_id, regions } = this.props;
    const region = regions[guild_region_id];
    const convertDay = [6, 0, 1, 2, 3, 4, 5]
    const warDay = moment(date).tz(region.timezone).day();

    return convertDay[warDay];
  }

  componentWillMount() {
    const { date } = this.state;

    this.fetchWarsForDate(date);
  }

  fetchWarsForDate(date) {
    const { dispatch, guild_id } = this.props;

    dispatch(WarService.list({
      context: { guild_id },
      params: {
        expand: 'node',
        include: 'stats',
        date__year: date.year,
        date__month: date.month,
        outcome__isnull: false,
      },
    }))
  }

  handleDateChange(date) {
    this.setState({date});

    this.fetchWarsForDate(date);
  }

  fetchWarStats(war) {
    const { dispatch, guild_id } = this.props;

    dispatch(WarStatsService.list({
      context: { guild_id, war_id: war.id },
      params: {
        page_size: 100,
        expand: "attendance",
        ordering: "attendance__user_profile__family_name",
      },
    }));
  }

  handleViewWarStats(war) {
    this.setState({
      selectedWar: war,
      showStats: true
    })

    this.fetchWarStats(war);
  }

  renderStatsDialog() {
    const { war_stats } = this.props;
    const { selectedWar } = this.state;

    if (war_stats.isLoading || !war_stats.isLoaded) {
      return;
    }

    return (
      <Dialog modal={false}
              open={true}
              autoScrollBodyContent={true}
              contentStyle={{width: '100%', maxWidth: 1450, maxHeight: "100%"}}
              onRequestClose={() => this.setState({showStats: false, selectedWar: null})}>
        <WarStatTable items={war_stats.items} />
      </Dialog>
    )
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

  onWarEdit(war) {
    const { dispatch, guild_id } = this.props;

    this.setState({
      selectedWar: war,
      editStat: true
    })

    this.fetchWarStats(war);

    const war_day = this.getWarDayFromDate(war.date)

    dispatch(WarNodesService.list({ params: { page_size: 50, war_day }}));
    dispatch(MemberService.list({
      context: { guild_id },
      params: {
        page_size: 125,
      }
    }))
  }

  renderTimeline() {
    const {
      guild_region_id,
      regions,
      war,
    } = this.props;
    const region = regions[guild_region_id];
    const buttonStyle = {
      top: -18,
      left: 9,
      width: 36,
      padding: 0
    }
    const generateStatsButton = (onClick) => (
      <IconButton tooltip="Stats"
                  style={buttonStyle}
                  onClick={onClick}>
        <StatIcon color="#ffffff" />
      </IconButton>
    );
    const editPermission = this.memberHasPermission('change_member_attendance') && this.memberHasPermission('change_war')
    const deletePermission = this.memberHasPermission('delete_war')
    const generateEditButton = (onClick) => {
      return editPermission && (
        <IconButton tooltip="Edit"
                    style={buttonStyle}
                    onClick={onClick}>
          <EditIcon color="#ffffff" />
        </IconButton>
      );
    };
    const generateDeleteButton = (onClick) => {
      return deletePermission && (
        <IconButton tooltip="Delete"
                    style={buttonStyle}
                    onClick={onClick}>
          <DeleteIcon color="#ffffff" />
        </IconButton>
      );
    };

    const iconStyle = {
      objectFit: 'none',
      transform: 'scale(0.7, 0.7)',
      position: 'relative',
      top: -12,
      left: 0,
      width: 40,
      height: 40,
    }
    const labelStyle = {
      verticalAlign: "top",
      padding: "0px 30px 0px 15px",
    }
    const wars = war.items.filter(war => war.outcome != null);

    if (wars.length === 0) {
      return <EmptyState text="No wars found" />
    }

    return (
      <Timeline>
        {
          wars.map((data) => {
            const date = new Date(data['date']);
            const title = data['node'] && `T${data['node']['tier']}: ${data['node']['name']}` || '???';
            const styling = data['outcome'] != null && this.outcomeMappings[data['outcome']] || this.unknownStyle;

            return <TimelineEvent title={title}
                                  createdAt={<Time timezone={region.timezone}>{date}</Time>}
                                  buttons={[
                                    generateStatsButton(() => this.handleViewWarStats(data)),
                                    generateEditButton(() => this.onWarEdit(data)),
                                    generateDeleteButton(() => this.setState({selectedWar: data, showDelete: true})),
                                  ]}
                                  container="card"
                                  style={{boxShadow: "0 0 6px 1px #999"}}
                                  cardHeaderStyle={{backgroundColor: "rgb(0, 188, 212)", color: "#FFF"}}
                                  {...styling}>
                      {
                        data['note'] && <div>{data['note']}</div>
                      }
                      <Tooltip label="Attendance Count">
                        <GroupIcon color="rgb(66,66,66)"/>
                        <label style={labelStyle}>{data.stats.attendance_count}</label>
                      </Tooltip>

                      <Tooltip label="Forts Destroyed">
                        <img src={FortIcon} title="Forts Destroyed" />
                        <label style={labelStyle}>{data.stats.total_forts_destroyed}</label>
                      </Tooltip>

                      <Tooltip label="Total Kills">
                        <img src={KillIcon} />
                        <label style={labelStyle}>{data.stats.total_kills}</label>
                      </Tooltip>

                      <Tooltip label="Total Deaths">
                        <img src={DeathIcon} />
                        <label style={labelStyle}>{data.stats.total_deaths}</label>
                      </Tooltip>

                      <Tooltip label="Total Helps">
                        <img src={HelpIcon} />
                        <label style={labelStyle}>{data.stats.total_helps}</label>
                      </Tooltip>
                    </TimelineEvent>
          })
        }
      </Timeline>
    );
  }

  handleWarStatUpdate() {
    const { dispatch } = this.props;
    const { date } = this.state;

    this.setState({selectedWar: null, editStat: false})

    this.fetchWarsForDate(date);
    dispatch(WarStatsService.clearLoaded())

    toast.success("War has been updated")
  }

  onWarDeleteSuccess() {
    const { date } = this.state;

    this.fetchWarsForDate(date);

    this.setState({
      showDelete: false,
      selectedWar: null,
    })

    toast.success("War has been deleted")
  }

  handleDelete() {
    const { dispatch, guild_id } = this.props;
    const { selectedWar } = this.state;

    dispatch(WarService.destroy({
      id: selectedWar.id,
      context: { guild_id, },
      onSuccess: this.onWarDeleteSuccess.bind(this)
    }))
  }

  renderDeleteDialog() {
    const { war } = this.props;
    const { selectedWar } = this.state;
    const confirmationMessage = (
      <div>
        <div>Are you sure you want to delete the war on <Time>{selectedWar.date}</Time>?</div>
        <div style={{marginTop: 16}}><strong>This will remove the war and all associated attendance and stats.</strong></div>
      </div>
    )

    return <ConfirmDialog buttonsDisabled={war.isLoading}
                          onCancel={() => this.setState({showDelete: false, selectedWar: null})}
                          onConfirm={this.handleDelete.bind(this)}
                          title="Delete War"
                          content={confirmationMessage}/>
  }

  renderEditStatsDialog() {
    const { selectedWar } = this.state;
    const { guild_id, members, war_nodes, war_stats } = this.props;

    const stats = war_stats.items.map((stat) => {
      return {
        ...stat,
        name: stat.attendance.name,
    }})
    const memberChoices = members.items.map((member, index) => {
      return {
        id: member.user,
        value: member.family_name,
        title: member.family_name,
        text: member.family_name,
      }
    })

    return <WarStatEditDialog isLoading={members.isLoading || war_stats.isLoading || war_nodes.isLoading}
                              title="Edit War"
                              guild_id={guild_id}
                              outcome={selectedWar.outcome}
                              membersAutocomplete={memberChoices}
                              node={selectedWar.node && selectedWar.node.id || null}
                              nodes={war_nodes.items}
                              note={selectedWar.note}
                              onClose={() => this.setState({selectedWar: null, editStat: false})}
                              onConfirm={this.handleWarStatUpdate.bind(this)}
                              showAttendanceToggle={false}
                              showAddRow={true}
                              stats={stats}
                              war_id={selectedWar.id} />
  }

  render() {
    const { date, editStat, maxDate, showDelete, showStats } = this.state;
    const { war } = this.props;
    const pickerLang = {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        from: 'From', to: 'To',
    }

    if (!war.isLoaded || war.count > 0 && !war.items[0].stats) {
      return <LoadingWidget />
    }

    return (
      <Grid componentClass={Paper} style={{padding: "20px 0px"}}>
        <div style={{padding: "0px 45px"}}>
          <Picker ref="pickAMonth"
                  years={{min: {year: 2017, month: 1}, max: maxDate}}
                  value={date}
                  lang={pickerLang.months}
                  onChange={() => this.refs.pickAMonth.dismiss()}
                  onDismiss={this.handleDateChange.bind(this)}>
            <TextField floatingLabelText="Show wars for"
                       value={`${pickerLang.months[date.month-1]} ${date.year}`}
                       onClick={() => this.refs.pickAMonth.show()}
                       onFocus={() => this.refs.pickAMonth.show()}
                       style={{width: 120}} />
          </Picker>
        </div>

        { this.renderTimeline() }

        { showStats && this.renderStatsDialog() }

        { editStat && this.renderEditStatsDialog() }

        { showDelete && this.renderDeleteDialog() }
      </Grid>
    )
  }
}

const mapStateToProps = (state) => {
  return {
      guild_region_id: state.guild.selected.region,
      members: state.members,
      profile: state.profile.selected,
      regions: state.auth.user.regions,
      role_permissions: state.auth.user.role_permissions,
      war: state.war,
      war_stats: state.war_stats,
      war_nodes: state.warNodes,
  };
};

export default connect(mapStateToProps)(GuildHistory);