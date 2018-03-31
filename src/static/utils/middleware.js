import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';

import LoadingWidget from '../components/LoadingWidget';
import {
  GuildService,
} from '../services';


export function requireAuthentication(Component) {
    class AuthenticatedComponent extends React.Component {
        static propTypes = {
            location: PropTypes.shape({
                pathname: PropTypes.string.isRequired
            }).isRequired,
            dispatch: PropTypes.func.isRequired
        };

        componentWillMount() {
            this.checkAuth();
        }

        componentWillReceiveProps(nextProps) {
            this.checkAuth();
        }

        checkAuth() {
            if (!this.props.user) {
                const redirectAfterLogin = this.props.location.pathname;
                this.props.dispatch(push(`/login?next=${redirectAfterLogin}`));
            }
        }

        render() {
            return (
                <div>
                    {this.props.user !== null
                        ? <Component {...this.props} />
                        : null
                    }
                </div>
            );
        }
    }

    const mapStateToProps = (state) => {
        return {
            user: state.auth.user,
            token: state.auth.token
        };
    };

    return connect(mapStateToProps)(AuthenticatedComponent);
}


export function requireProfile(Component) {
    class MiddlewareComponent extends React.Component {
        static propTypes = {
            location: PropTypes.shape({
                pathname: PropTypes.string.isRequired
            }).isRequired,
            dispatch: PropTypes.func.isRequired
        };

        componentWillMount() {
            this.checkProfile();
        }

        componentWillReceiveProps(nextProps) {
            this.checkProfile();
        }

        checkProfile() {
            const viewingNewProfile = this.props.location.pathname == '/newProfile/';

            if (!this.props.user.profile_id && !viewingNewProfile) {
                this.props.dispatch(push('/newProfile/'));
            } else if (this.props.user.profile_id && viewingNewProfile) {
                this.props.dispatch(push('/'));
            }
        }

        render() {
            return (
                <div>
                    {this.props.user !== null
                        ? <Component {...this.props} />
                        : null
                    }
                </div>
            );
        }
    }

    const mapStateToProps = (state) => {
        return {
            user: state.auth.user,
        };
    };

    return connect(mapStateToProps)(MiddlewareComponent);
}


export function guildMiddleware(Component) {
    class MiddlewareComponent extends React.Component {
        static propTypes = {
            location: PropTypes.shape({
                pathname: PropTypes.string.isRequired
            }).isRequired,
            dispatch: PropTypes.func.isRequired
        };

        constructor() {
          super();

          this.state = {
            loading: false,
            loaded: false,
          }
        }

        componentWillMount() {
            this.check();
        }

        check() {
          const { dispatch, guild, match } = this.props;
          const guild_id = match.params.guild_id;

          if (!guild.selected || guild.selected.id != guild_id) {
            this.setState({loading: true});
            dispatch(GuildService.get({
              id: guild_id,
              params: { include: 'stats,integrations' },
              onSuccess: () => this.setState({loading: false, loaded: true}),
              onError: () => this.setState({loading: false}),
            }));
          } else {
            this.setState({loaded: true});
          }
        }

        render() {
            const { loading, loaded } = this.state;

            if (loading) {
              return <LoadingWidget />;
            }
            if (!loading && !loaded) {
              return <Redirect to="/404"/>;
            }

            return (
                <div>
                    {this.props.user !== null
                        ? <Component {...this.props} />
                        : null
                    }
                </div>
            );
        }
    }

    const mapStateToProps = (state) => {
        return {
            guild: state.guild,
        };
    };

    return connect(mapStateToProps)(MiddlewareComponent);
}


export default function applyMiddlewares(Component) {
  // Layer the components
  return requireAuthentication(requireProfile(Component));
}