import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router';
import BaseView from '../../components/BaseView'
import { Link } from 'react-router';
import {Tabs, Tab} from 'material-ui/Tabs';
import { push } from 'react-router-redux';
import IconButton from 'material-ui/IconButton';
import SettingsIcon from 'material-ui/svg-icons/action/settings';
import NotificationIcon from 'material-ui/svg-icons/social/notifications';
import Badge from 'material-ui/Badge';
import { toast } from 'react-toastify';

import GuildOverview from './GuildOverview'
import GuildMembers from './GuildMembers'
import GuildWar from './GuildWar'
import GuildHistory from './GuildHistory'
import GuildFormDialog from './GuildFormDialog'
import LoadingWidget from '../../components/LoadingWidget'
import Tooltip from '../../components/Tooltip'
import { GuildService } from '../../services'

class GuildView extends React.Component {
  constructor(props) {
    super(props);

      this.state = {
        showEditDialog: false,
      }
  }

  componentDidMount() {
    const { dispatch, guild, match } = this.props;

    if (!guild.isLoading && !guild.selected) {
      dispatch(GuildService.get({ id: match.params.guild_id, params: { include: 'stats,integrations' } }));
    }
  }

  handleGuildEdit() {
    this.setState({showEditDialog: true});
  }

  handleEditSuccess() {
    const { dispatch, match } = this.props;

    this.setState({showEditDialog: false});

    dispatch(GuildService.get({ id: match.params.guild_id, params: { include: 'stats,integrations' } }));

    toast.success("Guild has been updated")
  }

  memberHasPermission(permission) {
    const { profile, match, role_permissions } = this.props;

    if (!profile) {
      return false;
    }

    const guild_role = profile.membership.find((membership) => membership.guild.id == parseInt(match.params.guild_id)).role.id;
    const guild_permissions = role_permissions[guild_role]

    return guild_permissions.includes(permission);
  }

  renderWarLabel() {
    const { guild } = this.props;

    if (!guild.selected || !guild.selected.pending_war) {
      return <span>War</span>;
    }

    return (
      <div>
        <span style={{padding: 6, position: 'relative', bottom: 3}}>War</span>
        <NotificationIcon style={{height: 16, width: 16}} color="#edc71c" />
      </div>
    );
  }

  renderContent() {
    const  { match } = this.props;
    const guild_id = parseInt(match.params.guild_id);

    return (
      <Switch>
        <Route path={`${match.url}/overview`} render={(props) => <GuildOverview guild_id={guild_id} {...props} />} />
        <Route path={`${match.url}/members`} render={(props) => <GuildMembers guild_id={guild_id} {...props} />} />
        <Route path={`${match.url}/history`} render={(props) => <GuildHistory guild_id={guild_id} {...props} />} />
        <Route path={`${match.url}/war`} render={(props) => <GuildWar guild_id={guild_id} {...props} />} />
        <Redirect from={match.url} to={`${match.url}/overview`} />
        <Route path='*' render={() => <Redirect to="/404"/> } />
      </Switch>
    );
  }

  renderTabs() {
    const  { dispatch, location, match } = this.props;

    const navItems = [
      {
        name: "Overview",
        url: `${match.url}/overview`,
        component: GuildOverview,
        disabled: !this.memberHasPermission('view_overview'),
      },
      {
        name: "Members",
        url: `${match.url}/members`,
        component: GuildMembers,
        disabled: !this.memberHasPermission('view_members'),
      },
      {
        name: "History",
        url: `${match.url}/history`,
        component: GuildHistory,
        disabled: !this.memberHasPermission('view_history'),
      },
      {
        name: this.renderWarLabel(),
        url: `${match.url}/war`,
        component: GuildWar,
        disabled: !this.memberHasPermission('view_war'),
      },
    ];
    const defaultIndex = Math.max(navItems.findIndex((item) => location.pathname.includes(item.url)), 0)
    const guild_id = parseInt(match.params.guild_id);

    return (
      <div>
        <Tabs initialSelectedIndex={defaultIndex}>
          {
            navItems.map((item) => {
              const label = !item.disabled && item.name || <Tooltip label="You do not have permission to view this">{item.name}</Tooltip>;
              return <Tab key={item.name} disabled={item.disabled} label={label} onActive={() => dispatch(push(item.url))} />
            })
          }
        </Tabs>
      </div>
    );
  }

  renderEditButton() {
    if (!this.memberHasPermission('change_guild_info')) {
      return null;
    }

    return (
      <IconButton tooltip="Edit Guild"
                  onClick={this.handleGuildEdit.bind(this)}>
        <SettingsIcon />
      </IconButton>
    )
  }

  render() {
    const { guild, match, profile } = this.props;
    const { showEditDialog } = this.state;

    return (
      <BaseView title={guild.selected && guild.selected.name || null}
                 isLoading={!guild.selected}
                iconElementRight={this.renderEditButton()}>
        { this.renderTabs() }
        { this.renderContent() }
        <GuildFormDialog handleSubmitSuccess={this.handleEditSuccess.bind(this)}
                         canEditIntegration={this.memberHasPermission('change_guild_integration')}
                         open={showEditDialog}
                         onClose={() => this.setState({showEditDialog: false})} />
      </BaseView>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    role_permissions: state.auth.user.role_permissions,
    guild: state.guild,
    profile: state.profile.selected,
  };
};

export default connect(mapStateToProps)(GuildView)