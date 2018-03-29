import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import {Timeline, TimelineBlip, TimelineEvent} from 'react-event-timeline'
import { connect } from 'react-redux';
import FontIcon from 'material-ui/FontIcon';
import Dialog from 'material-ui/Dialog';
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import StatIcon from 'material-ui/svg-icons/social/poll';
import GroupIcon from 'material-ui/svg-icons/social/group';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';

import EmptyState from '../../components/EmptyState';
import Time from '../../components/Time';
import LoadingWidget from '../../components/LoadingWidget';
import Tooltip from '../../components/Tooltip';
import {
  WarService,
  WarStatsService,
  MemberService,
} from '../../services';
import WarStatTable from './WarStatTable';
import ConquestIcons from './images/conquest_icons.png';
import FortIcon from './images/castle.png';
import KillIcon from './images/sword-cross.png';
import DeathIcon from './images/skull.png';
import HelpIcon from './images/human-greeting.png';
import Picker from 'react-month-picker';
require('react-month-picker/css/month-picker.css')


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
      selectedWar: null,
    }
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

  handleViewWarStats(war) {
    const { dispatch, guild_id } = this.props;

    this.setState({
      selectedWar: war,
      showStats: true
    })

    dispatch(WarStatsService.list({
      context: { guild_id, war_id: war.id },
      params: { page_size: 100 },
    }))
  }

  renderStatsDialog() {
    const { warStats } = this.props;
    const { selectedWar } = this.state;

    if (warStats.isLoading || !warStats.isLoaded) {
      return;
    }

    return (
      <Dialog modal={false}
              open={true}
              autoScrollBodyContent={true}
              contentStyle={{width: '100%', maxWidth: 1450, maxHeight: "100%"}}
              onRequestClose={() => this.setState({showStats: false, selectedWar: null})}>
        <WarStatTable items={warStats.items} />
      </Dialog>
    )
  }

  renderTimeline() {
    const { war } = this.props;
    const generateButton = (onClick) => (
      <IconButton tooltip="Stats"
                  style={{top: -18, left: 9}}
                  onClick={onClick}>
        <StatIcon color="#ffffff" />
      </IconButton>
    );
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
                                  createdAt={<Time>{date}</Time>}
                                  buttons={generateButton(() => this.handleViewWarStats(data))}
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

  render() {
    const { date, maxDate, showStats } = this.state;
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
      </Grid>
    )
  }
}

const mapStateToProps = (state) => {
  return {
      war: state.war,
      warStats: state.war_stats,
  };
};

export default connect(mapStateToProps)(GuildHistory);