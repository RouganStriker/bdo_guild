import React from 'react';
import { Link } from 'react-router';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import LinearProgress from 'material-ui/LinearProgress';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import {ListItem} from 'material-ui/List';
import {Tabs, Tab} from 'material-ui/Tabs';

// Icons
import HomeIcon from 'material-ui/svg-icons/action/home'
import GroupIcon from 'material-ui/svg-icons/social/group'
import SettingsIcon from 'material-ui/svg-icons/action/settings'
import ListIcon from 'material-ui/svg-icons/action/list'

import {
  ProfileService,
} from '../services';


class BaseView extends React.Component {
    constructor() {
      super()

      this.state = {
        navOpen: false,
      }
    }

    handleNavMenuClose() {
      this.setState({navOpen: false})
    }

    handleNav(location) {
      this.props.dispatch(push(location));
      this.handleNavMenuClose();
    }

    componentWillMount() {
      const { dispatch, profile, user } = this.props;

      if (!profile.isLoading && !profile.selected ) {
        dispatch(ProfileService.get({ id: user.profile_id, params: { include: 'stats' } }))
      }
    }

    renderNavBar() {
      const { title, iconElementRight, user } = this.props;
      const { navOpen } = this.state;
      const guild_links = user.guilds.map((membership, index) => {
        return (
          <ListItem key={index}
                    leftIcon={<GroupIcon />}
                    onClick={() => this.handleNav(`/guilds/${membership.guild.id}/`)}
                    primaryText={membership.guild.name} />
        );
      })

      guild_links.push(
        <ListItem
          key={-1}
          leftIcon={<ListIcon />}
          onClick={() => this.handleNav('/guilds')}
          primaryText="View All"
        />
      );

      return (
        <div>
          <AppBar
            title={title}
            onLeftIconButtonTouchTap={() => this.setState({navOpen: true})}
            zDepth={0}
            iconElementRight={iconElementRight}
          />
          <Drawer docked={false}
                  open={navOpen}
                  onRequestChange={(navOpen) => this.setState({navOpen})}>
            <MenuItem onClick={() => this.handleNav('/')}
                      leftIcon={<HomeIcon />}>
              Dashboard
            </MenuItem>
            <ListItem
              primaryText="Guilds"
              primaryTogglesNestedList={true}
              leftIcon={<GroupIcon />}
              nestedItems={guild_links}>
            </ListItem>
            <MenuItem onClick={() => this.handleNav('/settings')}
                      leftIcon={<SettingsIcon />}>
              Settings
            </MenuItem>
          </Drawer>
        </div>
      )
    }

    renderFooter() {
      return (
        <div className="footer">
          BDO Guild 2017.
        </div>
      );
    }

    renderBody() {
        const { isLoading, profile, showNavBar, renderContent } = this.props;

        if (isLoading || !profile.selected) {
          return <LinearProgress />;
        }

        return (
          <div>
            { showNavBar && this.renderNavBar() }
            { renderContent && renderContent() }
            { this.props.children }
          </div>
        )
    }

    render() {
        const { isLoading, profile, showNavBar } = this.props;
        return (
          <div className="app">
            { this.renderBody() }
            { this.renderFooter() }
          </div>
        );
    }
}

BaseView.propTypes = {
  title: PropTypes.string,
  iconElementRight: PropTypes.object,
  showNavBar: PropTypes.bool,
  isLoading: PropTypes.bool,
  renderContent: PropTypes.func,
};

BaseView.defaultProps = {
  title: '',
  showNavBar: true,
  isLoading: false,
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
  profile: state.profile,
});

export default connect(mapStateToProps)(BaseView);
