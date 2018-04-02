import React from 'react';
import { connect } from 'react-redux';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import { Grid, Row, Col } from 'react-bootstrap';
import { push } from 'react-router-redux';
import Paper from 'material-ui/Paper';
import { Field, reduxForm, submit } from 'redux-form';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';

import { required } from '../../utils/validations';
import { renderTextField } from '../../components/Fields'
import BaseView from '../../components/BaseView'
import Form from '../../components/Form'
import {
  AuthService,
  ProfileService,
}  from '../../services'


class RequireFamilyNameView extends React.Component {
  handleKeyPress(event) {
    const { dispatch } = this.props;

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      dispatch(submit('profile'));
    }
  }

  render() {
    const { handleSubmit } = this.props;

    return (
      <Dialog open={true}
              model={true}
              title={`Welcome to BDO Guilds, ${user.discord_id}!`}
              actions={[<FlatButton
                label="Submit"
                primary={true}
                onClick={() => this.props.dispatch(submit('profile'))}
              />]}>
        <p>
          Please enter in your BDO account's Family Name.
          All statistics will be associated with the family name. You cannot change
          this value once it is set.
        </p>
        <Form onSubmit={handleSubmit}>
          <Field name="family_name"
                 component={renderTextField}
                 label="Family Name"
                 className="form-field"
                 validate={[required]}
                 fullWidth={true}
                 onKeyPress={this.handleKeyPress.bind(this)} />
        </Form>
      </Dialog>
    );
  }
}

function submitForm(values, dispatch, props) {
  const { id, family_name } = values

  dispatch(ProfileService.create({
    payload: { family_name },
    form: 'profile',
    onSuccess: (result) => {
      window.location.assign('/settings');
    },
  }));
}

const mapStateToProps = (state) => {
  return {
    user: state.auth.user,
  };
};

const formOptions = {
  form: 'profile',
  onSubmit: submitForm,
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(RequireFamilyNameView)
);
