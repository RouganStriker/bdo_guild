import { gettext } from 'django-i18n';
import React, { Component } from 'react';
import { Field, FieldArray, reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import Subheader from 'material-ui/Subheader';
import Save from 'material-ui/svg-icons/content/save';
import Dialog from 'material-ui/Dialog';

import { renderTextField, renderSelectField } from '../../components/Fields'
import CharacterService from '../../services/users/character/service'
import CharacterClassService from '../../services/content/classes/service';
import Form from '../../components/Form'

class CharacterForm extends React.Component {
  componentWillMount() {
    const { characterClass, dispatch } = this.props;

    if (characterClass.count === 0) {
      dispatch(CharacterClassService.list());
    }
  }

  render() {
    const { characterClass, handleSubmit } = this.props;
    const menuItems = (
      characterClass.items.map(charClass => {
        return <MenuItem key={charClass.id} value={charClass.id} primaryText={charClass.name} />;
      })
    );

    return (
      <Form onSubmit={handleSubmit}>
        <Field name="name"
               component={renderTextField}
               label="Character Name"
               className="form-field" />
        <Field name="character_class"
               component={renderSelectField}
               label="Class"
               className="form-field"
               style={{ verticalAlign: "bottom" }}
               menuStyle={{ verticalAlign: "bottom" }}>
           { menuItems }
        </Field>
        <Field name="level"
               component={renderTextField}
               label="Level"
               className="form-field" />
        <Field name="ap"
               component={renderTextField}
               label="AP"
               className="form-field" />
        <Field name="aap"
               component={renderTextField}
               label="Awakening Weapon AP"
               className="form-field" />
        <Field name="dp"
               component={renderTextField}
               label="DP"
               className="form-field" />
      </Form>
    );
  }
}


function submit(values, dispatch, props) {
  const { handleSubmitSuccess, initialValues } = props;

  if (initialValues) {
    dispatch(CharacterService.update({ id: initialValues.id, payload: values, form: 'character', onSuccess: handleSubmitSuccess }));
  } else {
    dispatch(CharacterService.create({ payload: values, form: 'character', onSuccess: handleSubmitSuccess }));
  }

}

const mapStateToProps = state => ({
  characterClass: state.characterClasses,
});

const formOptions = {
  form: 'character',
  onSubmit: submit,
};

export default connect(mapStateToProps)(
  reduxForm(formOptions)(CharacterForm)
);
