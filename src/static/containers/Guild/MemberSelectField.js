/*
  Auto-complete field with search dialog.
*/
import { debounce } from 'throttle-debounce';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
const ReactDOM = require('react-dom')
import Paper from 'material-ui/Paper';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import AutoComplete from 'material-ui/AutoComplete';
import IconButton from 'material-ui/IconButton';
import SearchIcon from 'material-ui/svg-icons/action/search';
import ClearIcon from 'material-ui/svg-icons/content/clear';
import ShowIcon from 'material-ui/svg-icons/action/visibility';
import HideIcon from 'material-ui/svg-icons/action/visibility-off';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import DataTables from 'material-ui-datatables';

import AttendanceTable from './AttendanceTable'

const _ = require('lodash');


class MemberSelectField extends React.Component {
  constructor(props) {
    super();

    const { members, role, initiallySelected } = props;
    const selectedMember = initiallySelected ? members.find((attendee) => attendee.id === initiallySelected) : null;

    this.state = {
      selected: selectedMember || null,
      searchText: selectedMember && selectedMember.name || '',
      showSearchDialog: false,
      filterMembersByRole: true,
      filteredMembers: this.filterMembers(true, selectedMember, members, role),
      searchDialogSelected: null,
      showSearch: false,
    }

    this.handleMemberSelect = debounce(10, (member) => this._handleMemberSelect(member));
  }

  componentWillReceiveProps(nextProps) {
    const { members, role, initiallySelected } = nextProps;
    const membersUpdated = !_.isEqual(this.props.members, members);
    const roleUpdated = !_.isEqual(this.props.role, role);
    const initiallySelectedUpdated = !_.isEqual(this.props.initiallySelected, initiallySelected);

    if (!membersUpdated && !roleUpdated && !initiallySelectedUpdated) {
      // No change
      return;
    }

    const selectedMember = members.find((attendee) => attendee.id === initiallySelected);

    this.setState({
      selected: selectedMember || null,
      searchText: selectedMember && selectedMember.name || '',
      filteredMembers: this.filterMembers(true, selectedMember, members, role),
    })
  }

  filterMembers(filterMembersByRole, selectedMember = null, members = null, role = null) {
    let _members = members || this.props.members;
    const _role = role || this.props && this.props.role || null;
    const _selectedMember = selectedMember || (this.state && this.state.selected);

    if (!filterMembersByRole || role === null || _role.id === -1) {
      // Role ID -1 is the ANY role
      return _members;
    } else {
      return _members.filter((member) => {
        return member.user_profile.preferred_roles.indexOf(_role.id) !== -1;
      });
    }
  }

  resetSelection() {
    const { selected, searchText } = this.state;

    if (searchText === '') {
      // Clear selection
      this.setState({selected: null})
    } else if (!selected) {
      // Clear search text
      this.setState({searchText: ''})
    } else {
      // Reset to last selection
      this.setState({searchText: selected.name})
    }
  }

  validateInput = (fieldSearchText) => {
    // Clear current selection if it is invalid
    const { filteredMembers, searchText } = this.state;
    const text = fieldSearchText || searchText;
    const selected = text ? filteredMembers.find((member) => member.name.toLowerCase() === text.toLowerCase()) : null;

    if (selected || selected === null) {
      this.handleMemberSelect(selected)
    } else {
      // selected is undefined, no match found
      this.resetSelection()
    }
  }

  handleUpdateInput = (searchText) => {
    this.setState({
      searchText: searchText,
    });
  };

  handleNewRequest = (chosenRequest, index) => {
    if (index > -1) {
      this.handleMemberSelect(this.state.filteredMembers[index])
      return;
    }

    this.validateInput(chosenRequest);
  };

  handleBlur() {
    if (!this.refs.autocomplete.state.open) {
      // Focus did not shift to menu
      this.validateInput();
    }
  }

  handleSuggestionMenuClose() {
    const textHasFocus = document.activeElement === ReactDOM.findDOMNode(this.refs.autocomplete.refs.searchTextField)

    if (!textHasFocus) {
      // Focus is not on text field
      this.validateInput();
    }
  }

  _handleMemberSelect(member) {
    const { onMemberSelected } = this.props;

    if (this.state.selected !== member) {
      this.setState({
        searchDialogSelected: null,
        searchText: member && member.name || '',
        selected: member,
      })

      onMemberSelected && onMemberSelected(member);
    }
  }

  handleMemberSelectionChange(member) {
    this.setState({searchDialogSelected: member})
  }

  handleFilterToggle() {
    const { filterMembersByRole } = this.state;

    this.setState({
      filterMembersByRole: !filterMembersByRole,
      filteredMembers: this.filterMembers(!filterMembersByRole),
    })
  }

  renderSearchContent() {
    const { role } = this.props;
    const { filterMembersByRole, filteredMembers } = this.state;
    const filterMembersByRoleButton = (
      <IconButton onClick={this.handleFilterToggle.bind(this)}
                  tooltip={filterMembersByRole && "Display All Members" || "Filter By Preferred Roles"}>
        {filterMembersByRole && <HideIcon /> || <ShowIcon /> }
      </IconButton>
    )

    return (
      <AttendanceTable attendance={filteredMembers}
                       onSelectionChange={this.handleMemberSelectionChange.bind(this)}
                       onSelectionDoubleClick={this.handleSearchSelect.bind(this)}
                       showCharacterDetails={true}
                       selectable={true}
                       title={"Available Members"}
                       toolbarActions={role && [filterMembersByRoleButton] || null} />
    )
  }

  handleSearchSelect(member) {
    this.handleMemberSelect(member || this.state.searchDialogSelected)
    this.handleSearchClose()
  }

  handleSearchClose() {
    this.setState({
      showSearchDialog: false
    })

    if (!this.state.filterMembersByRole) {
      // Reset filter
      this.setState({
        filterMembersByRole: true,
        filteredMembers: this.filterMembers(true),
      })
    }
  }

  renderSearchDialog() {
    const { searchDialogSelected } = this.state;
    const actions = [
      <FlatButton
        label="Cancel"
        onClick={this.handleSearchClose.bind(this)}
      />,
      <FlatButton
        disabled={!searchDialogSelected}
        label="Select"
        primary={true}
        onClick={() => this.handleMemberSelect(this.state.searchDialogSelected)}
      />,
    ];

    return (
      <Dialog
        actions={actions}
        autoScrollBodyContent={true}
        modal={false}
        open={true}
        onRequestClose={this.handleSearchClose.bind(this)}
      >
        {this.renderSearchContent()}
      </Dialog>
    )
  }

  render() {
    const { canEdit, isLoading, label, user } = this.props;
    const { filteredMembers, selected, showSearch, showSearchDialog } = this.state;
    const isSelfSelected = selected && selected.user_profile.id === user.profile_id;

    return (
      <div style={{height: 86}}
           onMouseEnter={() => this.setState({showSearch: true})}
           onMouseLeave={() => this.setState({showSearch: false})}>
        <AutoComplete disabled={!canEdit || isLoading}
                      filter={AutoComplete.fuzzyFilter}
                      floatingLabelText={label}
                      floatingLabelFixed={true}
                      fullWidth={true}
                      hintText="Select Member"
                      inputStyle={{
                        paddingRight: showSearch && 40 || 0,
                        whiteSpace: "nowrap",
                        overflow: "hiddne",
                        textOverflow: "ellipsis",
                        fontWeight: isSelfSelected && 600 || 'inherit',
                      }}
                      searchText={this.state.searchText}
                      onClose={this.handleSuggestionMenuClose.bind(this)}
                      openOnFocus={true}
                      onUpdateInput={this.handleUpdateInput}
                      onNewRequest={this.handleNewRequest.bind(this)}
                      onBlur={this.handleBlur.bind(this)}
                      dataSource={filteredMembers}
                      maxSearchResults={5}
                      dataSourceConfig={{
                        text: 'name',
                        value: 'id',
                      }}
                      textFieldStyle={{
                        verticalAlign: "bottom"
                      }}
                      ref="autocomplete"
        />
        {
          canEdit && showSearch && [
            <IconButton disabled={isLoading}
                        iconStyle={{width: 24, height: 24}}
                        key='search'
                        style={{bottom: 11, right: 44, width: 24, height: 24, padding: 0}}
                        onClick={() => this.setState({showSearchDialog: true})}>
              <SearchIcon />
            </IconButton>,
            <IconButton disabled={isLoading}
                        iconStyle={{width: 24, height: 24}}
                        key='clear'
                        style={{bottom: 11, right: 46, width: 24, height: 24, padding: 0}}
                        onClick={() => this.handleMemberSelect(null)}>
              <ClearIcon />
            </IconButton>
          ]
        }
        {
          showSearchDialog && this.renderSearchDialog()
        }
      </div>
    )
  }
}


MemberSelectField.propTypes = {
  canEdit: PropTypes.bool,
  initiallySelected: PropTypes.number,
  isLoading: PropTypes.bool,
  members: PropTypes.array,
  onMemberSelected: PropTypes.func,
  role: PropTypes.object,
};

MemberSelectField.defaultProps = {
  canEdit: false,
  isLoading: false,
  role: null,
};

const mapStateToProps = (state) => {
  return {
    user: state.auth.user
  }
};

export default  connect(mapStateToProps)(MemberSelectField);
