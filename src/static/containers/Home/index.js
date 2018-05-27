import React from 'react';
import { Link } from 'react-router-dom'
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid, Row, Col } from 'react-bootstrap';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Paper from 'material-ui/Paper';
import DataTables from 'material-ui-datatables';

import ConquestIcons from '../Guild/images/conquest_icons.png';
import LoadingWidget from '../../components/LoadingWidget';
import BaseView from '../../components/BaseView';
import EmptyState from '../../components/EmptyState';
import Time from '../../components/Time';
import Tooltip from '../../components/Tooltip';
import WarStatTable from '../Guild/WarStatTable';
import {
  UserStatsService,
  UserWarsService,
} from '../../services';

class HomeView extends React.Component {
  componentDidMount() {
    const { dispatch, user } = this.props;

    dispatch(UserStatsService.list({context: { profile_id: user.profile_id }, params: { page_size: 5 }}));
    dispatch(UserWarsService.list({context: { profile_id: user.profile_id }, params: { active: true }}));
  }

  getStatTotalColumns() {
    const {
      sortable,
      showName,
      showDate,
      showGuild,
    } = this.props;

    const iconStyle = {
      objectFit: 'none',
      transform: 'scale(0.7, 0.7)',
      position: 'relative',
      left: -5,
      width: 30,
      height: 40,
    }
    const columnOptions = {
      sortable: false,
      style: {
        width: 40
      }
    }

    let columns = [
      {
        key: 'command_post',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '0 0'}} />,
        tooltip: 'Command Post',
        ...columnOptions,
      },
      {
        key: 'fort',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-61px 0'}} />,
        tooltip: 'Fortress',
        ...columnOptions,
      },
      {
        key: 'gate',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-126px 0'}} />,
        tooltip: 'Gate',
        ...columnOptions,
      },
      {
        key: 'help',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-193px 0'}} />,
        tooltip: 'Help',
        ...columnOptions,
      },
      {
        key: 'mount',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-253px 0'}} />,
        tooltip: 'Mount',
        ...columnOptions,
      },
      {
        key: 'placed_objects',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-319px 0'}} />,
        tooltip: 'Placed Objects',
        ...columnOptions,
      },
      {
        key: 'guild_master',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-384px 0'}} />,
        tooltip: 'Guild Master',
        ...columnOptions,
      },
      {
        key: 'officer',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-448px 0'}} />,
        tooltip: 'Officer',
        ...columnOptions,
      },
      {
        key: 'member',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-512px 0'}} />,
        tooltip: 'Member',
        ...columnOptions,
      },
      {
        key: 'death',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-575px 0'}} />,
        tooltip: 'Death',
        ...columnOptions,
      },
      {
        key: 'siege_weapons',
        label: <img src={ConquestIcons} style={{...iconStyle, width: 40, objectPosition: '-635px 0'}} />,
        tooltip: 'Siege Weapons',
        ...columnOptions,
      },
      {
        key: 'attended',
        label: 'Attendance',
        sortable: false,
        style: {width: 120},
        render: (_, all) => {
          const { wars_attended, wars_unavailable, wars_missed } = all;
          return (
            <Tooltip label='Attended / Unavailable / Missed'>
                {[wars_attended, wars_unavailable, wars_missed].join(" / ")}
            </Tooltip>
          );
        }
      },
      {
        key: 'total_kills',
        label: "Kills",
        ...columnOptions,
      },
      {
        key: 'kdr',
        label: "KDR",
        ...columnOptions,
      },
    ];

    return columns;
  }

  renderTotalStatTable() {
    const { profile } = this.props;

    if (profile.selected.stats == null) {
      return <EmptyState text="You have no recorded stats" />
    }

    return (
      <DataTables columns={this.getStatTotalColumns()}
                  count={1}
                  data={[profile.selected.stats]}
                  page={1}
                  showCheckboxes={false}
                  showFooterToolbar={false}
                  showHeaderToolbar={false}
                  showHeaderToolbarFilterIcon={false}
                  tableBodyStyle={{
                    overflowX: 'auto'
                  }}
                  tableStyle={{
                    width: 'initial'
                  }} />
    )
  }

  renderRecentWars() {
      const { stats } = this.props;

      if (stats.count === 0) {
        return <EmptyState text="You have no recorded stats" />
      }

      return <WarStatTable items={stats.items}
                           showName={false}
                           showGuild={true}
                           showDate={true}
                           sortable={false} />
  }

  renderPendingWars() {
    const { wars } = this.props;

    if (wars.items.length == 0) {
      return <span>No new notifications</span>
    }

    return (
      <ul>
        { wars.items.map(war => {
            return (
              <li style={{marginBottom: 16}}>
                  <div>
                    <Link to={`/guilds/${war.guild_id}/war`}>
                      [{war.guild}]: <Time children={war.date} />
                    </Link>
                  </div>
                  <div style={{marginTop: 5}}>Node: {war.node && war.node || ''}</div>
                  { war.attendance && war.attendance.team && <div style={{marginTop: 5}}>Team: {war.attendance.team}</div>}
                  { war.attendance && war.attendance.call_sign && <div style={{marginTop: 5}}>Call Sign: {war.attendance.call_sign}</div>}
              </li>
            );
          })
        }
      </ul>
    );
  }

  renderContent() {
    const { profile, stats, user } = this.props;

    return (
      <Grid componentClass={Paper} style={{padding: 0}}>
        <Card>
          <CardText>
            <h4>Hello, { profile.selected && profile.selected.family_name }</h4>
          </CardText>
        </Card>
        <Card initiallyExpanded={true}>
          <CardHeader title="Notifications"
                      actAsExpander={true}
                      showExpandableButton={true} />
          <CardText expandable={true}>
            { this.renderPendingWars() }
          </CardText>
        </Card>
        <Card initiallyExpanded={true}>
          <CardHeader title="Your Stat Totals"
                      actAsExpander={true}
                      showExpandableButton={true} />
          <CardText expandable={true}>
            { this.renderTotalStatTable() }
          </CardText>
        </Card>
        <Card initiallyExpanded={true}>
          <CardHeader title="Your Last 5 Wars"
                      actAsExpander={true}
                      showExpandableButton={true}/>
          <CardText expandable={true}>
            { this.renderRecentWars() }
          </CardText>
        </Card>
      </Grid>
    );
  }
  render() {
      const { stats, wars } = this.props;

      return (
        <BaseView title={"Dashboard"}
                  isLoading={!stats.isLoaded || !wars.isLoaded}
                  renderContent={this.renderContent.bind(this)} />
      );
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.auth.user,
    profile: state.profile,
    stats: state.stats,
    wars: state.user_wars,
  };
};

export default connect(mapStateToProps)(HomeView);
export { HomeView as HomeViewNotConnected };
