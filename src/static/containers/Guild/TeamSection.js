import PropTypes from 'prop-types';
import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

import LoadingWidget from '../../components/LoadingWidget';
import TeamFormDialog from './TeamFormDialog';
import TeamWidget from './TeamWidget';

import {
  WarAttendanceService,
  WarTeamService,
} from '../../services';


class TeamSection extends React.Component {
  constructor() {
    super();

    this.state = {
      showDialog: false,
      selected: null,
    }
  }

  componentWillMount() {
    const { attendance, dispatch, guild, team, war } = this.props;

    if (!attendance.isLoaded && !attendance.isLoading) {
      dispatch(WarAttendanceService.list({ context: { guild_id: guild.id, war_id: war.id }, params: { expand: 'user_profile' }}));
    }
    if (!team.isLoaded && !team.isLoading) {
      dispatch(WarTeamService.list({ context: { guild_id: guild.id, war_id: war.id }}));
    }
  }

  fetchTeams() {
    const { dispatch, guild, war } = this.props;

    dispatch(WarTeamService.list({ context: { guild_id: guild.id, war_id: war.id }}));
  }

  handleTeamSubmitSuccess() {
    this.handleCloseTeamDialog();
    this.fetchTeams();
  }

  handleCloseTeamDialog() {
    this.setState({showDialog: false, selected: null})
  }

  handleEditTeam(team_id) {
    this.setState({showDialog: true, selected: team_id})
  }

  handleDeleteTeam(team_id) {
    this.props.dispatch(WarTeamService.destroy({id: team_id, onSuccess: this.fetchTeams.bind(this)}))
  }

  handleMemberChange() {
    const { dispatch, guild, war } = this.props;

    this.fetchTeams();
    dispatch(WarAttendanceService.list({ context: { guild_id: guild.id, war_id: war.id }, params: { expand: 'user_profile' }}));
  }

  handleMemberSelected(id, slot, attendee) {
    const { dispatch, war } = this.props;

    dispatch(WarTeamService.setSlot({
      id,
      payload: {
        slot,
        attendee_id: attendee && attendee.id || null,
      },
      onSuccess: () => this.handleMemberChange()
    }))
  }

  renderTeams() {
    const { attendance, canEdit, guild, team, war_roles } = this.props;
    const { selected } = this.state;

    let attendingMembers = attendance.items.filter((attendee) => attendee.is_attending === 0);
    attendingMembers = attendingMembers.map((attendee) => {
      if (!attendee.user_profile.character_set) {
        return attendee
      }
      const selectedCharacter = attendee.user_profile.character_set.find((char) => char.id === attendee.character);

      return {
        ...attendee,
        class: selectedCharacter && selectedCharacter.character_class || null,
        gearscore: selectedCharacter && Math.max(selectedCharacter.ap, selectedCharacter.aap) + selectedCharacter.dp || null,
      }
    })
    if (team.items.length === 0) {
      return <div style={{textAlign: 'center'}}>No teams set</div>
    }

    const platoons = team.items.filter((team) => team.type === 0);
    const parties = team.items.filter((team) => team.type === 1);
    const createTeamWidget = (team_data, values, is_party) => (
      <TeamWidget available_roles={war_roles.items}
                  canEdit={canEdit}
                  handleDelete={() => this.handleDeleteTeam(team_data.id)}
                  handleEdit={() => this.handleEditTeam(team_data.id)}
                  headerStyle={{
                    backgroundColor: "rgba(0, 188, 212, 0.2)",
                    border: "1px solid rgb(224, 224, 224)"
                  }}
                  isLoading={team.isLoading}
                  key={team_data.id}
                  name={team_data.name}
                  members={attendingMembers}
                  onMemberSelected={(slot_number, member) => this.handleMemberSelected(team_data.id, slot_number, member)}
                  tableProps={ is_party && {wrapperStyle: { display: "inline-block", width: "25%"}} || null}
                  values={values} />
    )

    return (
      <div>
        {
          platoons.map((team_data) => {
            const values = Array.from(new Array(5), (x, row_index) => {
              return Array.from(new Array(4), (y, col_index) => {
                const index = (row_index + 1) + (col_index * 5);

                return team_data.slots[index-1];
              })
            })
            return createTeamWidget(team_data, values, false)
          })
        }
        {
          parties.map((team_data) => {
            const values = Array.from(new Array(5), (x, row_index) => {
              return [team_data.slots[row_index]];
            })

            return createTeamWidget(team_data, values, true)
          })
        }
      </div>
    )
  }

  renderDialog() {
    const { guild, war, team, war_roles } = this.props;
    const { showDialog, selected } = this.state;
    const initialValues = selected && team.items.find((team) => team.id === selected) || null;

    return (
      showDialog && <TeamFormDialog available_roles={war_roles.items || []}
                                    guild_id={guild.id}
                                    initialValues={initialValues}
                                    war_id={war.id}
                                    handleSubmitSuccess={this.handleTeamSubmitSuccess.bind(this)}
                                    onClose={this.handleCloseTeamDialog.bind(this)} />
    );
  }


  render() {
    const { attendance, canEdit, guild, team, war } = this.props;
    const isLoaded = attendance.isLoaded && team.isLoaded;
    const isLoading = attendance.isLoading && team.isLoading;

    return (
      <Card initiallyExpanded={true}>
        <CardHeader
          title="Teams"
          actAsExpander={true}
          showExpandableButton={true}
        />

        { !isLoaded && <LoadingWidget /> }

        <CardText expandable={true}>
          { isLoaded && this.renderTeams() }
        </CardText>
        {
          canEdit &&
          <CardActions expandable={true}>
            <FlatButton disabled={!isLoaded || isLoading}
                        primary={true}
                        label="Add Team"
                        onClick={() => this.setState({showDialog: true})} />
          </CardActions>
        }

        { isLoaded && canEdit && this.renderDialog() }
      </Card>
    );
  }
}

const mapStateToProps = (state) => {
  return {
      attendance: state.warAttendance,
      war_roles: state.war_roles,
      team: state.war_team,
  };
};

TeamSection.propTypes = {
  guild: PropTypes.object.isRequired,
  war: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
  canEdit: PropTypes.bool,
};

export default connect(mapStateToProps)(TeamSection)