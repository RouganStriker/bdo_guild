import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { MuiThemeProvider } from 'material-ui/styles';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import './styles/main.scss';
import defaultTheme from './muitheme';
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
        const muiTheme = getMuiTheme(defaultTheme);

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
