import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import Badge from 'material-ui/Badge';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import TextField from 'material-ui/TextField';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import SettingsIcon from 'material-ui/svg-icons/action/settings';
import SelectField from 'material-ui/SelectField';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Paper from 'material-ui/Paper';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import MenuItem from 'material-ui/MenuItem';
import EditIcon from 'material-ui/svg-icons/image/edit';
import Dialog from 'material-ui/Dialog';
import { toast } from 'react-toastify';

import LoadingWidget from '../../components/LoadingWidget';
import Time from '../../components/Time';
import AttendanceFormDialog from './AttendanceFormDialog';
import AttendanceTable from './AttendanceTable';
import CallSignFormDialog from './CallSignFormDialog';
import WarFormDialog from './WarFormDialog';
import WarStatDialog from './WarStatDialog';
import TeamFormDialog from './TeamFormDialog';
import TeamWidget from './TeamWidget';
import WarningDialog from '../../components/WarningDialog';
import TeamSection from './TeamSection';
import CallSignSection from './CallSignSection';
import {
  GuildService,
  MemberService,
  WarAttendanceService,
  WarCallSignService,
  WarRoleService,
  WarService,
  WarTeamService,
} from '../../services';

const _ = require('lodash');


class GuildWar extends React.Component {
  constructor() {
    super();

    this.bannerColors = {
      attending: {
        buttonBackground: "rgb(35, 165, 34)",
        bannerBackground: "rgba(35, 165, 34, 0.2)",
        label: "Attending",
      },
      notAttending: {
        buttonBackground: "rgb(160, 0, 0)",
        bannerBackground: "rgba(160, 0, 0, 0.2)",
        label: "Not Attending",
      },
      undecided: {
        buttonBackground: "rgb(165, 165, 165)",
        bannerBackground: "rgba(165, 165, 165, 0.2)",
        label: "Undecided",
      }
    };

    this.defaultState = {
      openAttendanceDialog: false,
      openWarDetailsDialog: false,
      openTeamDialog: false,
      openCallSignDialog: false,
      openFinishWarDialog: false,
      selectedTeamID: null,
      selectedCallSignID: null,
      showDeleteWarningDialog: false,
      showAttending: false,
      showNotAttending: false,
      showUndecided: false,
    }
    this.state = {
      ...this.defaultState,
      attending: [],
      not_attending: [],
      undecided: [],
      unassigned: 0,
    }
  }

  getContext() {
    const { guild_id, war: { selected } } = this.props;

    return { guild_id, war_id: selected.id };
  }

  componentDidMount() {
    const { auth, guild, members, war, war_roles, attendance, dispatch, guild_id, profile } = this.props;

    if (this.memberHasPermission('add_war')) {
      dispatch(GuildService.attendanceEstimate({ id: guild_id }))
    }

    dispatch(MemberService.list({ context: { guild_id }, params: { expand: 'user,role', page_size: 100 }, onSuccess: this.calculateAttendance.bind(this)}))

    if (!guild.selected || !guild.selected.pending_war) {
      return;
    }

    dispatch(WarService.get({ id: guild.selected.pending_war, context: { guild_id }, params: { expand: 'node' } }));

    if (!war_roles.isLoaded && !war_roles.isLoading) {
      dispatch(WarRoleService.list({ context: { guild_id, war_id: guild.selected.pending_war }}));
    }

    this.refreshAttendance(guild.selected.pending_war);
  }

  memberHasPermission(permission) {
    const { profile, guild_id, auth } = this.props;

    if (!profile.selected) {
      return false;
    }

    const guild_role = profile.selected.membership.find((membership) => membership.guild.id == parseInt(guild_id)).role.id;
    const guild_permissions = auth.user.role_permissions[guild_role]

    return guild_permissions.includes(permission);
  }

  refreshWarDetails() {
    const { dispatch, guild_id, guild } = this.props;

    dispatch(WarService.get({ id: guild.selected.pending_war, context: { guild_id: guild_id }, params: { expand: 'node' } }));
  }

  refreshAttendance(id) {
    const { dispatch, guild_id, war } = this.props;
    const war_id = id || war.selected && war.selected.id

    dispatch(WarAttendanceService.getMyAttendance({ context: { guild_id, war_id } }));
    dispatch(WarAttendanceService.list({ context: { guild_id, war_id }, params: { expand: 'user_profile', page_size: 100 }, onSuccess: this.calculateAttendance.bind(this) }));
  }

  onAttendanceUpdateSuccess() {
    this.refreshAttendance();

    toast.success("Your attendance has been updated");
  }

  handleAttendanceSubmitSuccess() {
    this.handleCloseDialog();

    this.onAttendanceUpdateSuccess();
  }

  handleWarFormSuccess() {
    const { dispatch, guild, guild_id } = this.props;

    this.handleCloseDialog();

    if (!guild.selected.pending_war) {
      dispatch(GuildService.get({ id: guild_id, params: { include: 'stats,integrations' }, onSuccess: (updated_guild) => {
        dispatch(WarService.get({ id: updated_guild.pending_war, context: { guild_id }, params: { expand: 'node' } }));
        dispatch(WarRoleService.list({ context: { guild_id, war_id: updated_guild.pending_war }}));
        dispatch(WarAttendanceService.getMyAttendance({ context: { guild_id, war_id: updated_guild.pending_war } }));
        dispatch(WarAttendanceService.list({ context: { guild_id, war_id: updated_guild.pending_war }, params: { expand: 'user_profile', page_size: 100 }, onSuccess: this.calculateAttendance.bind(this) }));
      }}));

      toast.success("War planning has started")
    } else {
      this.refreshWarDetails();

      toast.success("War details have been updated")
    }
  }

  handleDeleteWarSuccess() {
    const { dispatch, guild, guild_id } = this.props;

    this.handleCloseDialog();

    dispatch(WarService.clearSelected())
    dispatch(WarAttendanceService.clearLoaded())
    dispatch(GuildService.get({ id: guild_id, params: { include: 'stats' }}));
  }

  handleWarStatSuccess() {
    this.handleDeleteWarSuccess()

    toast.success("War has been finished")
  }

  handleCloseDialog() {
    this.setState(this.defaultState)
  }

  renderDialog(title, content, open) {
    return (
      <Dialog
        title={title}
        modal={false}
        open={open}
        onRequestClose={this.handleClose}
      >
        {content}
      </Dialog>
    )
  }

  renderEmptyState() {
    return (
      <Grid>
        <Row>
          <Col>
          <div style={{textAlign: "center", padding: 50}}>
            <div>No pending Node War</div>
            <div style={{marginTop: 20}}>Start one?</div>
          </div>
          </Col>
        </Row>
      </Grid>
    )
  }

  handleAttendanceToggle() {
    const { auth, attendance: { myAttendance }, dispatch, profile } = this.props;

    if (myAttendance === null) {
      // Undecided
      this.setState({openAttendanceDialog: true});
    } else {
      const payload = { is_attending: myAttendance.is_attending === 0 ? 1 : 0 }

      // Set an initial character for first toggle
      if (!myAttendance || (myAttendance.is_attending != 0 && myAttendance.character == null)) {
        if (profile.selected.character_set.length > 0) {
          payload["character"] = (profile.selected.character_set.find(char => char.is_main) || profile.selected.character_set[0]).id;
        }
      }

      dispatch(WarAttendanceService.updateMyAttendance({
        payload,
        context: this.getContext(),
        onSuccess: this.onAttendanceUpdateSuccess.bind(this),
      }))
    }
  }

  renderAttendanceCard() {
    const { attendance: { myAttendance } } = this.props;
    const is_undecided = !myAttendance || _.isEmpty(myAttendance) || myAttendance.is_attending == 2;
    const status = is_undecided ? 'undecided': myAttendance.is_attending === 0 ? 'attending' : 'notAttending';
    const { bannerBackground, buttonBackground, label } = this.bannerColors[status]

    return (
      <Card style={{padding: 16, backgroundColor: bannerBackground}}>
        <RaisedButton backgroundColor={buttonBackground}
                      label={label}
                      labelColor="#fff"
                      style={{marginRight: 20}}
                      onClick={this.handleAttendanceToggle.bind(this)} />
        <a className="link" onClick={() => this.setState({openAttendanceDialog: true})}>Edit attendance details</a>
        {
          this.memberHasPermission('add_war') &&
          <FloatingActionButton style={{position: "relative", float: "right", bottom: -23}}
                                onClick={() => this.setState({openWarDetailsDialog: true})}>
            <EditIcon />
          </FloatingActionButton>
        }
      </Card>
    );
  }

  calculateAttendance() {
    const { members } = this.props;
    const war_attendance = this.props.attendance;

    if (!war_attendance.isLoaded || !members.isLoaded) {
      return;
    }

    const attending = [];
    const not_attending = [];
    const undecided = [];
    let unassigned = 0;

    members.items.forEach((member) => {
      const attendance = war_attendance.items.find((attendance) => attendance.user_profile.id === member.user.id)

      let attendance_details = {
        name: member.user.family_name,
        profile_id: member.user.id,
        id: attendance && attendance.id || null,
        renege_rate: attendance && attendance.renege_rate || 0.0,
      }

      if (!attendance || attendance.is_attending === 2) {
        undecided.push(attendance_details);
        return;
      }

      attendance_details = {
        ...attendance_details,
        note: attendance.note,
        team: attendance.team,
        slot_number: attendance.slot_number,
      }

      if (attendance.is_attending === 0) {
        const character = member.user.character_set.find((char) => char.id === attendance.character)
        attendance_details = {
          ...attendance_details,
          preferred_roles: member.user.preferred_roles,
        }

        if (character) {
          attendance_details = {
            ...attendance_details,
            name: `${member.user.family_name} (${character.name})`,
            class: character.character_class,
            gearscore: Math.max(character.ap, character.aap) + character.dp,
          }
        }
        if (attendance.team === null) {
          unassigned += 1;
        }

        attending.push(attendance_details)
      } else {
        not_attending.push(attendance_details)
      }
    });

    this.setState({ attending, not_attending, undecided, unassigned });
  }

  renderDetailsCard() {
    const { war: { selected } } = this.props;
    const { showAttending, showNotAttending, showUndecided } = this.state;

    var node_name = "TBD";

    if (selected.node !== null) {
      node_name = `T${selected.node.tier}: ${selected.node.name}`
    }

    const date = new Date(selected.date);
    const { attending, not_attending, undecided, unassigned } = this.state;
    const attendingBtn =
      <FlatButton label={`${attending.length} Attending`}
                  onClick={() => this.setState({showAttending: true})}
                  disabled={attending.length === 0} />
    const badgedAttendingBtn = (
      <Badge badgeContent={unassigned}
             secondary={true}
             badgeStyle={{top: 12, right: 12}}>
        {attendingBtn}
      </Badge>
    )

    return (
      <Card>
        <CardHeader
          title="War Details"
          actAsExpander={false}
          showExpandableButton={false}
        />
        <CardText expandable={false}>
          <div>
            <label className="bdo-field-label">Date:</label><Time>{date}</Time>
          </div>
          <div>
            <label className="bdo-field-label">Node:</label><span>{node_name}</span>
          </div>
          <div>
            <label className="bdo-field-label">Notes:</label><span>{selected.note}</span>
          </div>
        </CardText>
        <CardActions>
          { unassigned && badgedAttendingBtn || attendingBtn }
          <FlatButton label={`${not_attending.length} Not Attending`}
                      onClick={() => this.setState({showNotAttending: true})}
                      disabled={not_attending.length === 0} />
          <FlatButton label={`${undecided.length} Undecided`}
                      onClick={() => this.setState({showUndecided: true})}
                      disabled={undecided.length === 0} />
        </CardActions>
        <Dialog autoScrollBodyContent={true}
                contentStyle={{
                  maxWidth: (showUndecided && 475) || (showNotAttending && 500) || 975,
                }}
                open={showAttending || showNotAttending || showUndecided}
                onRequestClose={this.handleCloseDialog.bind(this)}>
          { showAttending && <AttendanceTable attendance={attending}
                                              showCharacterDetails={true}
                                              showNote={true}
                                              showAssignment={true}
                                              showRenegeRate={true} /> }
          { showNotAttending && <AttendanceTable attendance={not_attending} showNote={true} /> }
          { showUndecided && <AttendanceTable attendance={undecided} /> }
        </Dialog>
      </Card>
    )
  }

  renderSignup() {
    const { guild_id, guild, members, profile, war, attendance } = this.props;

    if (profile.selected === null || war.selected === null || guild.selected === null || !members.isLoaded) {
      return <LoadingWidget />
    }

    const war_started = new Date(war.selected.date) < new Date();

    return (
      <Grid componentClass={Paper} style={{padding: 0}}>

        { this.renderAttendanceCard() }
        { this.renderDetailsCard() }

        <TeamSection guild={guild.selected}
                     canEdit={this.memberHasPermission('add_war')}
                     war={war.selected} />

        <CallSignSection guild={guild.selected}
                         canEdit={this.memberHasPermission('add_war')}
                         war={war.selected} />

        {
          this.memberHasPermission('add_war') &&
          <Card>
            <CardActions>
              <RaisedButton fullWidth={true}
                            disabled={!war_started}
                            label='Finish War'
                            onClick={() => this.setState({openFinishWarDialog: true})}
                            primary={true} />
            </CardActions>
          </Card>
        }
      </Grid>
    )
  }

  renderNoWar() {
      const create_war_link = (
        <a className="link" onClick={() => {this.setState({openWarDetailsDialog: true})}}>
          Click here to set one up.
        </a>
      );

      return (
        <Grid style={{padding: "40px 0px"}}>
          <div style={{textAlign: "center"}}>
            <span>No pending war. </span>
            { this.memberHasPermission('add_war') && create_war_link }
          </div>
        </Grid>
      )
  }

  render() {
    const { call_sign, guild_id, guild, profile, war, war_roles, attendance, war_team } = this.props;
    const {
      attending,
      not_attending,
      undecided,
      openAttendanceDialog,
      openFinishWarDialog,
      openTeamDialog,
      openWarDetailsDialog,
      openCallSignDialog,
      selectedCallSignID,
      selectedTeamID,
      showDeleteWarningDialog,
    } = this.state;

    const showTeamDialog = openTeamDialog && (!selectedTeamID || war_team.selected !== null)
    const showCallSignDialog = openCallSignDialog && (!selectedCallSignID || call_sign.selected !== null)

    return (
      <div>
        { guild.selected && !guild.selected.pending_war && this.renderNoWar() || this.renderSignup() }
        {
          openAttendanceDialog &&
          <AttendanceFormDialog open={true}
                                available_roles={war_roles.items}
                                characters={profile.selected.character_set}
                                guild_id={guild_id}
                                preferred_roles={profile.selected.preferred_roles}
                                profile_id={profile.selected.id}
                                war_id={war.selected.id}
                                handleSubmitSuccess={this.handleAttendanceSubmitSuccess.bind(this)}
                                onClose={this.handleCloseDialog.bind(this)} />
        }

        {
          openWarDetailsDialog &&
          <WarFormDialog attendanceEstimate={guild.attendanceEstimate}
                         open={true}
                         guild_id={guild_id}
                         guild_region={guild.selected.region}
                         handleDeleteSuccess={() => toast.success("War has been cancelled") && this.handleDeleteWarSuccess()}
                         handleSubmitSuccess={this.handleWarFormSuccess.bind(this)}
                         onClose={this.handleCloseDialog.bind(this)} />
        }
        {
          openFinishWarDialog &&
          <WarStatDialog attendance={[...attending, ...not_attending, ...undecided]}
                         guild_id={guild_id}
                         contentStyle={{minHeight: '90%'}}
                         handleSubmitSuccess={this.handleWarStatSuccess.bind(this)}
                         onClose={this.handleCloseDialog.bind(this)}/>
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
      auth: state.auth,
      profile: state.profile,
      attendance: state.warAttendance,
      guild: state.guild,
      members: state.members,
      war_team: state.war_team,
      war_roles: state.war_roles,
      call_sign: state.call_sign,
      war: state.war,
  };
};

export default connect(mapStateToProps)(GuildWar)