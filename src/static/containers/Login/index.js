import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { push } from 'react-router-redux';
import t from 'tcomb-form';
import PropTypes from 'prop-types';
import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';

import TextField from 'material-ui/TextField';
import DiscordIcon from './images/Discord-Logo-White.png';
import Divider from 'material-ui/Divider';
import * as actionCreators from '../../actions/auth';

const Form = t.form.Form;

const Login = t.struct({
    email: t.String,
    password: t.String
});

const LoginFormOptions = {
    auto: 'placeholders',
    help: <i>Hint: a@a.com / qw</i>,
    fields: {
        password: {
            type: 'password'
        }
    }
};

class LoginView extends React.Component {
    static propTypes = {
        dispatch: PropTypes.func.isRequired,
        location: PropTypes.shape({
            search: PropTypes.string.isRequired
        })
    };

    static defaultProps = {
        statusText: '',
        location: null
    };

    constructor(props) {
        super(props);

        const redirectRoute = this.props.location ? this.extractRedirect(this.props.location.search) || '/' : '/';
        this.state = {
            formValues: {
                email: '',
                password: ''
            },
            redirectTo: redirectRoute
        };
    }

    componentWillMount() {
        if (this.props.user) {
            this.props.dispatch(push('/'));
        }
    }

    onFormChange = (value) => {
        this.setState({ formValues: value });
    };

    extractRedirect = (string) => {
        const match = string.match(/next=(.*)/);
        return match ? match[1] : '/';
    };

    onSubmit = (e) => {
      const { dispatch, touchAll, valid } = this.props;

      if (!valid) {
        e.preventDefault();
        //dispatch(touchAll());
      }
    };

    render() {
      let statusText = null;
      if (this.props.statusText) {
        const statusTextClassNames = classNames({
          'alert': true,
          'alert-danger': this.props.statusText.indexOf('Authentication Error') === 0,
          'alert-success': this.props.statusText.indexOf('Authentication Error') !== 0
        });

        statusText = (
          <div className="row">
            <div className="col-sm-12">
              <div className={statusTextClassNames}>
                {this.props.statusText}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div style={{height: "100%", position: "absolute", width: "100%"}}>
          <div style={{height: "100%", position: "relative", display: "flex", justifyContent: "center", alignItems: "center"}}>
            <Paper style={{width: 400, height: 250, padding: "20px 30px"}}>
              <h1 className="text-center" style={{paddingTop: 40}}>BDO Guilds</h1>
              <Divider />
              <div className="login-container margin-top-medium">
                 <RaisedButton label="SIGN IN WITH DISCORD"
                               backgroundColor="#7289DA"
                               labelColor="#ffffff"
                               fullWidth={true}
                               style={{height: 50}}
                               icon={<img className="icon" src={DiscordIcon} />}
                               href="/accounts/discord_auth/login/?process=login" />
              </div>
            </Paper>
          </div>
        </div>
      );
  }
}

const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        dispatch,
        actions: bindActionCreators(actionCreators, dispatch)
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginView);
export { LoginView as LoginViewNotConnected };
