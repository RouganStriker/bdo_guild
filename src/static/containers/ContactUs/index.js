import React from 'react';
import { connect } from 'react-redux';
import { Grid } from 'react-bootstrap';
import {Card, CardText} from 'material-ui/Card';
import Paper from 'material-ui/Paper';
import { Field, reduxForm, submit } from 'redux-form';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import { toast } from 'react-toastify';

import BaseView from '../../components/BaseView';
import Form from '../../components/Form';
import { maxLength, required } from '../../utils/validations';
import { renderSelectField, renderTextField } from '../../components/Fields';
import {
  ContactService,
}  from '../../services'


class ContactUsView extends React.Component {

  renderContent() {
    const { pristine, submitting } = this.props;

    return (
      <Grid componentClass={Paper} style={{padding: 0}}>
        <Card style={{padding: 24}}>
          <CardText>
            <p>For help and other inquiries, use the form below to contact support.</p>

            {this.renderContactForm()}

            <RaisedButton label="Submit"
                          onClick={() => this.props.dispatch(submit('contact'))}
                          disabled={pristine || submitting}
                          primary={true}
                          style={{marginTop: 40}} />
          </CardText>
        </Card>
      </Grid>
    );
  }

  renderContactForm() {
    const { handleSubmit } = this.props;

    return (
      <Form onSubmit={handleSubmit}>
        <div>
          <Field name="email"
                 component={renderTextField}
                 label="Email"
                 floatingLabelFixed={true}
                 style={{width: 512}}
                 className="form-field"
                 validate={[required]} />
        </div>

        <div>
          <Field name="category"
                 component={renderSelectField}
                 label="Category"
                 hintText="Select a category"
                 floatingLabelFixed={true}
                 style={{width: 512}}
                 validate={[required]}
                 className="form-field">
            <MenuItem value="account" primaryText="Account Changes" />
            <MenuItem value="bug" primaryText="Bug" />
            <MenuItem value="feedback" primaryText="Feedback" />
            <MenuItem value="other" primaryText="Other" />
          </Field>
        </div>

        <div>
          <Field name="summary"
                 component={renderTextField}
                 label="Summary"
                 floatingLabelFixed={true}
                 style={{width: 512}}
                 className="form-field"
                 validate={[required, maxLength(255)]} />
        </div>

        <div>
          <Field name="description"
                 component={renderTextField}
                 label="Description"
                 floatingLabelFixed={true}
                 style={{width: 512}}
                 multiLine={true}
                 className="form-field"
                 validate={[required]} />
        </div>
      </Form>
    );
  }

  render() {
      return (
        <BaseView title={"Contact Us"}
                  renderContent={this.renderContent.bind(this)} />
      );
  }
}

function submitForm(values, dispatch, props) {
  dispatch(ContactService.create({
    payload: { ...values },
    form: 'contact',
    onSuccess: (result) => {
      toast.success("You message has been sent")
    },
  }))
}

const mapStateToProps = (state) => {
  return {
    initialValues: {
      email: state.auth.user.email
    }
  };
};

const formOptions = {
  form: 'contact',
  onSubmit: submitForm,
};

export default connect(mapStateToProps)(reduxForm(formOptions)(ContactUsView));
