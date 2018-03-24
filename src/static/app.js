import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { MuiThemeProvider } from 'material-ui/styles';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import LinearProgress from 'material-ui/LinearProgress';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';

import {List, ListItem} from 'material-ui/List';

// Icons
import HomeIcon from 'material-ui/svg-icons/action/home'
import GroupIcon from 'material-ui/svg-icons/social/group'
import SettingsIcon from 'material-ui/svg-icons/action/settings'
import ListIcon from 'material-ui/svg-icons/action/list'

import { authLogoutAndRedirect } from './actions/auth';
import AuthService from './services/auth/service'
import LoadingWidget from './components/LoadingWidget';
import './styles/main.scss';
import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

class App extends React.Component {
    static propTypes = {
        children: PropTypes.shape().isRequired,
        dispatch: PropTypes.func.isRequired,
        location: PropTypes.shape({
            pathname: PropTypes.string
        })
    };

    static defaultProps = {
        location: undefined
    };

    render() {
        const muiTheme = getMuiTheme({});

        return (
            <MuiThemeProvider muiTheme={muiTheme}>
              { this.props.children }
            </MuiThemeProvider>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        location: state.routing.location
    };
};

export default connect(mapStateToProps)(App);
export { App as AppNotConnected };
