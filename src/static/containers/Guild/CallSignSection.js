import PropTypes from 'prop-types';
import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

import LoadingWidget from '../../components/LoadingWidget';
import CallSignFormDialog from './CallSignFormDialog';
import TeamWidget from './TeamWidget';

import {
  WarAttendanceService,
  WarCallSignService,
} from '../../services';


class CallSignSection extends React.Component {
  constructor() {
    super();

    this.state = {
      showDialog: false,
      selected: null,
    }
  }

  componentWillMount() {
    const { attendance, callSign, dispatch, guild, war } = this.props;

    if (!callSign.isLoaded && !callSign.isLoading) {
      dispatch(WarCallSignService.list({ context: { guild_id: guild.id, war_id: war.id }}));
    }
  }

  fetchCallSigns() {
    const { dispatch, guild, war } = this.props;

    dispatch(WarCallSignService.list({ context: { guild_id: guild.id, war_id: war.id }}));
  }

  handleCallSignSubmitSuccess() {
    this.handleCloseCallSignDialog();
    this.fetchCallSigns();
  }

  handleCloseCallSignDialog() {
    this.setState({showDialog: false, selected: null})
  }

  handleDeleteCallSign(call_sign_id) {
    this.props.dispatch(WarCallSignService.destroy({id: call_sign_id, onSuccess: this.fetchCallSigns.bind(this)}));
  }

  handleEditCallSign(call_sign_id) {
    this.setState({showDialog: true, selected: call_sign_id})
  }

  handleMemberChange() {
    const { dispatch, guild, war } = this.props;

    this.fetchCallSigns();
    dispatch(WarAttendanceService.list({ context: { guild_id: guild.id, war_id: war.id }, params: { expand: 'user_profile', page_size: 100 }}));
  }

  handleMemberSelected(id, slot, attendee) {
    const { callSign, dispatch } = this.props;

    if (attendee) {
      dispatch(WarCallSignService.assign({
        id,
        payload: {
          attendee_id: attendee && attendee.id || null,
        },
        onSuccess: () => this.handleMemberChange()
      }))
    } else {
      const selectedCallSign = callSign.items.find((sign) => sign.id === id);

      dispatch(WarCallSignService.unassign({
        id,
        payload: {
          attendee_id: selectedCallSign.members[slot-1],
        },
        onSuccess: () => this.handleMemberChange()
      }))
    }
  }

  renderCallSigns() {
    const { attendance, canEdit, callSign } = this.props;

    let attendingMembers = attendance.items.filter((attendee) => attendee.is_attending === 0);
    attendingMembers = attendingMembers.map((attendee) => {
      const selectedCharacter = attendee.user_profile.character_set.find((char) => char.id === attendee.character);

      return {
        ...attendee,
        class: selectedCharacter && selectedCharacter.character_class || null,
        gearscore: selectedCharacter && (Math.max(selectedCharacter.ap, selectedCharacter.aap) + selectedCharacter.dp) || null,
      }
    })
    if (callSign.items.length === 0) {
      return <div style={{textAlign: 'center'}}>No call signs set</div>
    }

    return (
      callSign.items.map((obj) => {
        const values = Array.from(new Array(5), (x,i) => {
          const index = i + 1;

          return [{
            id: index,
            role_id: null,
            attendee_id: obj.members[i] || null,
          }];
        });

        return <TeamWidget canEdit={canEdit}
                           bodyStyle={{backgroundColor: "rgba(255, 131, 131, 0.05)"}}
                           handleDelete={() => this.handleDeleteCallSign(obj.id)}
                           handleEdit={() => this.handleEditCallSign(obj.id)}
                           headerStyle={{
                             backgroundColor: "rgba(255, 131, 131, 0.2)",
                             border: "1px solid rgb(224, 224, 224)"
                           }}
                           isLoading={callSign.isLoading}
                           key={obj.id}
                           name={obj.name}
                           members={attendingMembers}
                           onMemberSelected={(slot_number, member) => this.handleMemberSelected(obj.id, slot_number, member)}
                           tableProps={{wrapperStyle: { display: "inline-block", width: "25%"}}}
                           type='call_sign'
                           values={values} />
      })
    )
  }

  renderDialog() {
    const { callSign, guild, war } = this.props;
    const { showDialog, selected } = this.state;
    const initialValues = selected && callSign.items.find((sign) => sign.id === selected) || null;

    return (
      showDialog && <CallSignFormDialog guild_id={guild.id}
                                        initialValues={initialValues}
                                        war_id={war.id}
                                        handleSubmitSuccess={this.handleCallSignSubmitSuccess.bind(this)}
                                        onClose={this.handleCloseCallSignDialog.bind(this)} />
    );
  }

  render() {
    const { attendance, canEdit, callSign, guild, war } = this.props;
    const isLoaded = attendance.isLoaded && callSign.isLoaded;
    const isLoading = attendance.isLoading && callSign.isLoading;

    return (
      <Card initiallyExpanded={true}>
        <CardHeader
          title="Call Signs"
          actAsExpander={true}
          showExpandableButton={true}
        />

        { !isLoaded && <LoadingWidget /> }

        <CardText expandable={true}>
          { isLoaded && this.renderCallSigns() }
        </CardText>
        {
          canEdit &&
          <CardActions expandable={true}>
            <FlatButton disabled={!isLoaded || isLoading}
                        primary={true}
                        label="Add Call Sign"
                        onClick={() => this.setState({showDialog: true})} />
          </CardActions>
        }

        { isLoaded && this.renderDialog() }
      </Card>
    );
  }
}

const mapStateToProps = (state) => {
  return {
      attendance: state.warAttendance,
      callSign: state.call_sign,
  };
};

CallSignSection.propTypes = {
  guild: PropTypes.object.isRequired,
  war: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
  canEdit: PropTypes.bool,
};

export default connect(mapStateToProps)(CallSignSection)