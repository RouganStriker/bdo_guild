import React from 'react';
import { Link } from 'react-router-dom';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import LinearProgress from 'material-ui/LinearProgress';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import {ListItem} from 'material-ui/List';
import {Tabs, Tab} from 'material-ui/Tabs';
import { ToastContainer } from 'react-toastify';

// Icons
import HomeIcon from 'material-ui/svg-icons/action/home'
import GroupIcon from 'material-ui/svg-icons/social/group'
import SettingsIcon from 'material-ui/svg-icons/action/settings'
import ListIcon from 'material-ui/svg-icons/action/list'
import EmailIcon from 'material-ui/svg-icons/communication/email'

import {
  GuildService,
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

    handleNavToGuild(guild_id) {
      const { dispatch, guild } = this.props;
      // Reset selected guild if applicable
      if (guild.selected && guild.selected.id != guild_id) {
        dispatch(GuildService.clearSelected());
        dispatch(GuildService.get({ id: guild_id, params: { include: 'stats,integrations' } }));
      }
      this.handleNav(`/guilds/${guild_id}/`)
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
                    onClick={() => this.handleNavToGuild(membership.guild.id)}
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
      const textStyle = {
        fontSize: "small",
        color: "#999",
      }
      const activeLinkStyle = {
        color: "#777",
      }
      const footerStyle = {
        left: 0,
        bottom: 0,
        textAlign: "center",
        width: "100%",
        margin: 25,
        ...textStyle,
      };
      const iconStyle = {
        width: 18,
        height: 18,
      };
      const divider = <span style={{paddingLeft: 10, paddingRight: 10}}>|</span>;

      return (
        <div style={footerStyle}>
            <Link to="/privacy" style={textStyle} activeStyle={activeLinkStyle}>Privacy Policy</Link>
            {divider}
            <Link to="/contact" style={textStyle} activeStyle={activeLinkStyle}>Contact</Link>
            {divider}
            <a href="https://www.patreon.com/bdoguilds" style={textStyle}>Patreon</a>
            {divider}
            © {(new Date()).getFullYear()} BDO Guilds
        </div>
      );
    }

    renderBody() {
        const { isLoading, profile, showNavBar, renderContent } = this.props;

        if (isLoading || (profile.isLoading && !profile.selected)) {
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
            <ToastContainer hideProgressBar={true}
                            position="bottom-right" />
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
  guild: state.guild,
  profile: state.profile,
});

export default connect(mapStateToProps)(BaseView);
