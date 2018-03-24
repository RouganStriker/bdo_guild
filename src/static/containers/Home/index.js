import React from 'react';
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
import WarStatTable from '../Guild/WarStatTable';
import {
  UserStatsService,
} from '../../services';

class HomeView extends React.Component {
  componentDidMount() {
    const { dispatch, user } = this.props;

    dispatch(UserStatsService.list({context: { profile_id: user.profile_id }, params: { page_size: 5 }}));
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
        key: 'total_wars',
        label: 'War Count',
        ...columnOptions,
      },
      {
        key: 'total_command_post',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '0 0'}} />,
        tooltip: 'Command Post',
        ...columnOptions,
      },
      {
        key: 'total_fort',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-61px 0'}} />,
        tooltip: 'Fortress',
        ...columnOptions,
      },
      {
        key: 'total_gate',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-126px 0'}} />,
        tooltip: 'Gate',
        ...columnOptions,
      },
      {
        key: 'total_help',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-193px 0'}} />,
        tooltip: 'Help',
        ...columnOptions,
      },
      {
        key: 'total_mount',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-253px 0'}} />,
        tooltip: 'Mount',
        ...columnOptions,
      },
      {
        key: 'total_placed_objects',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-319px 0'}} />,
        tooltip: 'Placed Objects',
        ...columnOptions,
      },
      {
        key: 'total_guild_master',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-384px 0'}} />,
        tooltip: 'Guild Master',
        ...columnOptions,
      },
      {
        key: 'total_officer',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-448px 0'}} />,
        tooltip: 'Officer',
        ...columnOptions,
      },
      {
        key: 'total_member',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-512px 0'}} />,
        tooltip: 'Member',
        ...columnOptions,
      },
      {
        key: 'total_death',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-575px 0'}} />,
        tooltip: 'Death',
        ...columnOptions,
      },
      {
        key: 'total_siege_weapons',
        label: <img src={ConquestIcons} style={{...iconStyle, width: 40, objectPosition: '-635px 0'}} />,
        tooltip: 'Siege Weapons',
        ...columnOptions,
      },
      {
        key: 'total_kills',
        label: "Kills",
        ...columnOptions,
        render: (kills, all) => {
          if (kills !== undefined) {
            return kills;
          }
          return all.total_guild_master + all.total_officer + all.total_member + all.total_siege_weapons;
        }
      },
      {
        key: 'kdr',
        label: "KDR",
        ...columnOptions,
        render: (kdr, all) => {
          if (kdr !== undefined) {
            return kdr;
          }
          return parseFloat((all.total_guild_master + all.total_officer + all.total_member + all.total_siege_weapons) / all.total_death).toFixed(2);
        }
      },
    ];

    return columns;
  }

  renderTotalStatTable() {
    const { profile } = this.props;

    if (profile.selected.stats.total_wars === 0) {
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
      const { stats } = this.props;

      return (
        <BaseView title={"Dashboard"}
                  isLoading={!stats.isLoaded}
                  renderContent={this.renderContent.bind(this)} />
      );
  }
}

const mapStateToProps = (state) => {
  return {
    user: state.auth.user,
    profile: state.profile,
    stats: state.stats,
  };
};

export default connect(mapStateToProps)(HomeView);
export { HomeView as HomeViewNotConnected };
