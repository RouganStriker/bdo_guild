import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router';
import { push } from 'react-router-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import Paper from 'material-ui/Paper';
import {BottomNavigation, BottomNavigationItem} from 'material-ui/BottomNavigation';
import InfoIcon from 'material-ui/svg-icons/action/info';
import AttendanceIcon from 'material-ui/svg-icons/action/assignment-turned-in';

import GuildMemberAttendance from './GuildMemberAttendance';
import GuildMemberStats from './GuildMemberStats';

class GuildMembers extends React.Component {
  getNavItems() {
    const  { guild_id, match } = this.props;

    return [
      {
        path: `${match.url}/attendance`,
        label: "Attendance",
        icon: <AttendanceIcon />,
        render: (props) => <GuildMemberAttendance guild_id={guild_id} {...props} />,
      },
      {
        path: `${match.url}/info`,
        label: "Info",
        icon: <InfoIcon />,
        render: (props) => <GuildMemberStats guild_id={guild_id} {...props} />,
      },
    ]
  }

  render() {
    const  { dispatch, location, match } = this.props;
    const navItems = this.getNavItems();
    const defaultIndex = Math.max(navItems.findIndex((item) => location.pathname.includes(item.path)), 0)

    return (
      <Grid componentClass={Paper} style={{padding: 0}}>
        <Switch>
          {
            navItems.map((navItem, index) => {
              return <Route key={index} path={navItem.path} render={navItem.render} />
            })
          }
          <Redirect from={match.url} to={`${match.url}/info`} />
          <Route path='*' render={() => <Redirect to="/404"/> } />
        </Switch>

        <BottomNavigation selectedIndex={defaultIndex}>
          {
            navItems.map((navItem, index) => {
              return <BottomNavigationItem key={index}
                                           label={navItem.label}
                                           icon={navItem.icon}
                                           onClick={() => dispatch(push(navItem.path))} />
            })
          }
        </BottomNavigation>
      </Grid>
    )
  }
}

export default connect()(GuildMembers)