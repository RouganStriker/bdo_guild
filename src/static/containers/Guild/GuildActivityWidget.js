import PropTypes from 'prop-types';
import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import {Timeline, TimelineBlip} from 'react-event-timeline'
import InfiniteScroll from 'react-infinite-scroll-component';
import UpdateIcon from 'material-ui/svg-icons/action/update';
import DoneIcon from 'material-ui/svg-icons/action/done';
import GroupAddIcon from 'material-ui/svg-icons/social/group-add';
import GroupIcon from 'material-ui/svg-icons/social/group';
import DeviceHubIcon from 'material-ui/svg-icons/hardware/device-hub';
import DeleteIcon from 'material-ui/svg-icons/action/delete';
import EventAvailableIcon from 'material-ui/svg-icons/notification/event-available';
import EventBusyIcon from 'material-ui/svg-icons/notification/event-busy';
import EventNoteIcon from 'material-ui/svg-icons/notification/event-note';

import EmptyState from '../../components/EmptyState';
import LoadingWidget from '../../components/LoadingWidget';
import Time from '../../components/Time';
import {
  GuildActivityService,
} from '../../services';


class GuildActivityWidget extends React.Component {
  constructor() {
    super();

    this.state = {
      activities: [],
      hasMore: false,
      page: 1,
    }

    const iconProps = {
      color: "rgb(0, 188, 212)",
    }

    this.activityIconMapping = {
      1: <GroupAddIcon {...iconProps} />,       // "GUILD_CREATE"
      2: <GroupIcon {...iconProps} />,          // "GUILD_UPDATE"
      3: <DeviceHubIcon {...iconProps} />,      // "GUILD_UPDATE_INTEGRATION"
      4: <DeleteIcon {...iconProps} />,         // "GUILD_DELETE"
      5: <EventAvailableIcon {...iconProps} />,      // "WAR_CREATE"
      6: <EventNoteIcon {...iconProps} />,      // "WAR_UPDATE"
      7: <EventBusyIcon {...iconProps} />,      // "WAR_DELETE"
      8: <DoneIcon {...iconProps} />,      // "WAR_END"
      9: <UpdateIcon {...iconProps} />,      // "ATTENDANCE_UPDATE"
    }
  }

  componentWillMount() {
    this.loadMoreActivities()
  }

  loadMoreActivities() {
    const { dispatch, guild_id } = this.props;
    const { page } = this.state;

    dispatch(GuildActivityService.list({
      context: { guild_id },
      params: {
        page_size: 25,
        page
      },
      onSuccess: this.updateActivities.bind(this),
    }))
  }

  updateActivities(response) {
    const { hasNext, items } = response;

    this.setState({
      activities: [...this.state.activities, ...items],
      hasMore: hasNext,
      page: this.state.page + 1,
    })
  }

  renderActivityTimeline() {
    const { activity } = this.props
    const { activities, hasMore } = this.state;

    if (activity.isLoading && (!activity.isLoaded || activities.length === 0)) {
      return <LoadingWidget />
    } else if (activity.isLoaded && activities.length === 0) {
      return <EmptyState text={"No activities logged"} />
    }

    return (
      <InfiniteScroll dataLength={activities.length}
                      next={this.loadMoreActivities.bind(this)}
                      hasMore={hasMore}
                      height={300}
                      loader={<LoadingWidget />} >
        <Timeline>
          {
            activities.map((item) => {
              const title = (
                <div>
                  <strong>[<Time>{item.date}</Time>]:</strong> {item.description}
                </div>
              );

              return <TimelineBlip key={item.id}
                                   title={title}
                                   icon={this.activityIconMapping[item.type]}
                                   iconColor="rgb(0, 188, 212)" />
            })
          }
        </Timeline>
      </InfiniteScroll>
    )
  }

  render() {
    const style = {
      padding: 16
    }

    return (
      <div style={style}>
        <h4 className="bdo-heading">Activity Log</h4>
        { this.renderActivityTimeline() }
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    activity: state.guild_activity,
  };
};

GuildActivityWidget.propTypes = {
  guild_id: PropTypes.number,
};

export default connect(mapStateToProps)(GuildActivityWidget)