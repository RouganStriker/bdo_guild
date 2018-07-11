import React from 'react';
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText } from 'material-ui/Card';
import Paper from 'material-ui/Paper';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import MenuItem from 'material-ui/MenuItem';
import Dialog from 'material-ui/Dialog';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import { push } from 'react-router-redux';
import { Field, reduxForm, submit } from 'redux-form';
import { ToastContainer, toast } from 'react-toastify';

import { required } from '../../utils/validations';
import { renderSelectField, renderTextField } from '../../components/Fields'
import BaseView from '../../components/BaseView'
import Form from '../../components/Form'
import {
  ContactService,
  ProfileService,
}  from '../../services'


class RequireFamilyNameView extends React.Component {
  constructor() {
    super();

    this.state = {
      showHelp: false,
    }
  }

  handleKeyPress(event) {
    const { dispatch } = this.props;

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      dispatch(submit('profile'));
    }
  }

  renderForm() {
    const { handleSubmit, regions, submitting } = this.props;
    const { showHelp } = this.state;

    return (
      <div>
        {
          !showHelp &&
          <p>
            Please enter in your BDO account's Family Name.
            All statistics will be associated with the family name. You cannot change
            this value once it is set.
          </p> ||
          <p>
            If your family name is already taken, you may submit a request to dispute it.
            You will be contacted by support once the request has been received.
          </p>
        }
        <Form onSubmit={handleSubmit}>
          <Field name="family_name"
                 component={renderTextField}
                 label="Family Name"
                 className="form-field"
                 validate={[required]}
                 fullWidth={true}
                 disabled={submitting}
                 onKeyPress={this.handleKeyPress.bind(this)} />
          <Field name="region"
                 component={renderSelectField}
                 label="Region"
                 fullWidth={true}
                 disabled={submitting}
                 className="form-field">
            {
              Object.keys(regions).map((key) => {
                return <MenuItem key={parseInt(key)} value={parseInt(key)} primaryText={regions[key].name} />;
              })
            }
          </Field>
        { showHelp &&
          <Field name="email"
                 component={renderTextField}
                 label="Contact Email"
                 className="form-field"
                 validate={[required]}
                 fullWidth={true}
                 onKeyPress={this.handleKeyPress.bind(this)} />
        }
        </Form>
      </div>
    )
  }

  render() {
    const { showHelp } = this.state;
    const actions = [
      <FlatButton label={showHelp && "Back" || "Help"}
                  style={{float: "left"}}
                  onClick={() => this.setState({showHelp: !showHelp})} />,
      <RaisedButton label="Submit"
                    primary={true}
                    onClick={() => this.props.dispatch(submit('profile'))} />
    ];

    return (
      <div>
        <Dialog open={true}
                model={true}
                title={`Welcome to BDO Guilds, ${user.discord_id}!`}
                actions={actions}>
          { this.renderForm() }
        </Dialog>
        <ToastContainer hideProgressBar={true}
                        position="bottom-right" />
      </div>
    );
  }
}

function submitForm(values, dispatch, props) {
  const { id, family_name, email, region } = values
  const { registeredFields } = props;

  if (registeredFields.email) {
    // We are showing Help view
    dispatch(ContactService.create({
      payload: {
        category: "account",
        email,
        summary: "Duplicate Family Name",
        description: `The family name '${family_name}' is unavailable.`,
      },
      form: 'profile',
      onSuccess: (result) => {
        toast.success("Your request has been submitted.")
      },
    }));
  } else {
    dispatch(ProfileService.create({
      payload: { family_name, region },
      form: 'profile',
      onSuccess: (result) => {
        window.location.assign('/settings');
      },
    }));
  }
}

const mapStateToProps = (state) => {
  return {
    initialValues: {
      email: state.auth.user.email,
      region: 1,
    },
    regions: state.auth.user.regions,
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
