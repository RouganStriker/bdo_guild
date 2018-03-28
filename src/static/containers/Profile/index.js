import React, {Component} from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { submit } from 'redux-form'
import PropTypes from 'prop-types';
import DataTables from 'material-ui-datatables';
import GuildEmblemPlaceholder from 'material-ui/svg-icons/social/group';
import Divider from 'material-ui/Divider';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import { Grid, Row, Col } from 'react-bootstrap';
import {List, ListItem} from 'material-ui/List';
import LinearProgress from 'material-ui/LinearProgress';
import Dialog from 'material-ui/Dialog';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';

import CharacterForm from './CharacterForm';
import ProfileForm from './ProfileForm';
import SelectableList from '../../components/SelectableList';
import ConfirmDialog from '../../components/ConfirmDialog';
import CharacterTable from './CharacterTable';
import {
  AuthService,
  CharacterService,
  CharacterClassService,
  ProfileService,
} from '../../services';
import BaseView from '../../components/BaseView'
import AvailabilityTable from './AvailabilityTable';


class ProfileView extends React.Component {
    static propTypes = {
        dispatch: PropTypes.func.isRequired
    };

    componentWillMount() {
      const { characterClasses, dispatch, user } = this.props;

      this.setState({
        selectedIndex: 1,
        showCharacterDialog: false,
        characterDialogTitle: null,
        selectedCharacter: null,
        showConfirmDialog: false,
      });

      if (characterClasses.count === 0) {
        dispatch(CharacterClassService.list());
      }

      this.fetchUserCharacters();
    }

    fetchUserCharacters() {
      const { dispatch, user } = this.props;

      dispatch(CharacterService.list({ params: { profile: user.profile_id} }))
    }

    handleListMenuChange = (newIndex) => {
      this.setState({
        selectedIndex: newIndex,
      });
    };

    handleAddCharacter() {
      this.setState({
        showCharacterDialog: true,
        characterDialogTitle: "Create Character",
        selectedCharacter: null,
      })
    }

    handleCloseCharacterDialog() {
      this.setState({
        showCharacterDialog: false
      })
    }

    handleSaveCharacterSuccess() {
      const { dispatch } = this.props;

      this.fetchUserCharacters();
      this.handleCloseCharacterDialog();
    }

    handleCloseConfirmDialog() {
      this.setState({
        showConfirmDialog: false
      });
    }

    handleDeleteCharacter() {
      const { dispatch } = this.props;
      const { selectedCharacter } = this.state;

      dispatch(CharacterService.destroy({id: selectedCharacter, onSuccess: this.fetchUserCharacters.bind(this) }))
      this.handleCloseConfirmDialog();
    }

    handleTableEdit(id) {
      this.setState({
        showCharacterDialog: true,
        characterDialogTitle: "Edit Character",
        selectedCharacter: id,
      })
    }

    handleTableDelete(id) {
      this.setState({
        showConfirmDialog: true,
        selectedCharacter: id,
      })
    }

    handleToggleMain(id, is_main) {
      const { dispatch } = this.props;

      dispatch(CharacterService.update({ id, payload: { is_main }, onSuccess: this.fetchUserCharacters.bind(this) }))
    }

    handleAvailabilityChange(availability) {
      const { dispatch, profile } = this.props;

      dispatch(ProfileService.updateSelected({ id: profile.selected.id, payload: { availability } }));
    }

    handleToggleAutoSignUp(e, toggled) {
      const { dispatch, profile } = this.props;

      dispatch(ProfileService.update({ id: profile.selected.id, payload: { auto_sign_up: toggled } }));
    }

    renderProfile() {
      const { character, characterClasses, profile } = this.props;

      if ((!profile.selected && profile.isLoading) || !characterClasses.isLoaded) {
        return <LinearProgress mode="indeterminate" />;
      }

      const has_main = !!(character.items.find((char) => char.is_main));

      return (
        <div>
          { profile.selected && <ProfileForm /> }

          <h4 style={{ paddingTop: 30 }}>
            <span>Characters</span>
            <FloatingActionButton mini={true}
                                  style={{
                                    float: "right",
                                    position: "absolute",
                                    right: 55
                                  }}
                                  onClick={this.handleAddCharacter.bind(this)}>
              <ContentAdd />
            </FloatingActionButton>
          </h4>
          <Divider />

          <CharacterTable onRowEdit={this.handleTableEdit.bind(this)}
                          onRowDelete={this.handleTableDelete.bind(this)}
                          onToggleMain={this.handleToggleMain.bind(this)} />

          <h4 style={{ paddingTop: 30 }}>Availability</h4>
          <Divider />
          <div style={{ paddingTop: 20 }}>{"Specify your availability for node wars. Days are in NA time."}</div>

          <AvailabilityTable initialValues={profile.selected.availability}
                             onChange={this.handleAvailabilityChange.bind(this)} />

          <Toggle label="Enable auto sign up. Requires a main character specified."
                  disabled={!has_main}
                  style={{ paddingTop: 30 }}
                  defaultToggled={profile.selected.auto_sign_up}
                  onToggle={this.handleToggleAutoSignUp.bind(this)} />
        </div>
      );
    }

    renderAccount() {
      const { user } = this.props;

      return (
        <div>
          <h4>Account</h4>
          <Divider />

          <TextField value={user.discord_id}
                     disabled={true}
                     floatingLabelText="Discord ID" />
        </div>
      );
    }

    renderPanel(selectedIndex) {
      if (selectedIndex === 1) {
        return this.renderProfile();
      } else if (selectedIndex === 2) {
        return this.renderAccount();
      }
    }

    renderCharacterDialog() {
      const { character } = this.props;
      const { characterDialogTitle, showCharacterDialog, selectedCharacter } = this.state;
      const initialValues = !selectedCharacter ? null : character.items.find((char) => char.id === selectedCharacter);
      const actions = [
        <FlatButton
          label="Cancel"
          onClick={this.handleCloseCharacterDialog.bind(this)}
        />,
        <FlatButton
          label="Save"
          primary={true}
          onClick={ () => this.props.dispatch(submit('character')) }
        />,
      ];

      return (
        <Dialog
            title={characterDialogTitle}
            modal={false}
            actions={actions}
            onRequestClose={this.handleCloseCharacterDialog.bind(this)}
            open={showCharacterDialog}
          >
          <CharacterForm handleSubmitSuccess={this.handleSaveCharacterSuccess.bind(this)}
                         initialValues={initialValues} />
        </Dialog>
      );
    }

    render() {
        const { selectedIndex, showConfirmDialog } = this.state;

        return (
          <BaseView title={"Settings"}>
            <Grid componentClass={Paper}
                  style={{ padding: 0, overflowY: "hidden", overflowX: "hidden" }}>
              <Row>
                <Col xs={6}
                     md={4}
                     style={{ paddingRight: 0 }}>
                  <SelectableList defaultValue={selectedIndex} onChange={this.handleListMenuChange.bind(this)}>
                    <ListItem
                      value={1}
                      primaryText="Profile"
                      secondaryText="View your BDO profile settings"
                    />
                    <ListItem
                      value={2}
                      primaryText="Account"
                      secondaryText="View your account settings"
                    />
                  </SelectableList>
                </Col>
                <Col xs={12} md={8} style={{borderLeft: "lightgray thin solid", paddingTop: 20, paddingBottom: 20 }}>
                  <div style={{paddingRight: 20, minHeight: 300}}>
                    { this.renderPanel(selectedIndex) }
                  </div>
                </Col>
              </Row>

              { this.renderCharacterDialog() }

              <ConfirmDialog open={showConfirmDialog}
                             content="This character will be removed."
                             onCancel={this.handleCloseConfirmDialog.bind(this)}
                             onConfirm={this.handleDeleteCharacter.bind(this)} />
            </Grid>
          </BaseView>
      );
    }
}

const mapStateToProps = (state) => {
    return {
        auth: state.auth,
        profile: state.profile,
        user: state.auth.user,
        character: state.character,
        characterClasses: state.characterClasses,
    };
};

export default connect(mapStateToProps)(ProfileView);
export { ProfileView as ProfileView };
