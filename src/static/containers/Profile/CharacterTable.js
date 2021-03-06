import React, {Component} from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DataTables from 'material-ui-datatables';
import Checkbox from 'material-ui/Checkbox';
import IconButton from 'material-ui/IconButton';
import Delete from 'material-ui/svg-icons/action/delete';
import Edit from 'material-ui/svg-icons/image/edit';
import Star from 'material-ui/svg-icons/toggle/star';
import EmptyStar from 'material-ui/svg-icons/toggle/star-border';
import {yellow500} from 'material-ui/styles/colors';

import LoadingWidget from '../../components/LoadingWidget'


class CharacterTable extends React.Component {
    constructor(props) {
      super(props);

      this.TABLE_COLUMNS = [
        {
          key: 'is_main',
          label: 'Main',
          sortable: false,
          style: {
            minWidth: 50,
          },
          render: (is_main, all) => {
            return (
              <Checkbox
                checked={is_main}
                checkedIcon={<Star color={yellow500} />}
                onClick={() => this.props.onToggleMain(all.id, !is_main)}
                uncheckedIcon={<EmptyStar />}
              />
            );
          },

        },
        {
          key: 'name',
          label: 'Name',
          style: {
            minWidth: 100,
          },
        },
        {
          key: 'character_class',
          label: 'Class',
          style: {
            minWidth: 50,
          },
          render: (character_class, all) => {
            return this.props.characterClasses.items.find((_class) => _class.id === character_class).name;
          }
        },
        {
          key: 'level',
          label: 'Level',
          style: {
            minWidth: 50,
          },
        },
        {
          key: 'renown',
          label: 'Renown',
          style: {
            width: 100,
          },
          render: (renown, all) => {
            return (all.aap + all.ap)/2 + all.dp + props.profile.selected.npc_renown;
          },
        },
        {
          key: 'actions',
          label: '',
          sortable: false,
          style: {
            width: 120
          },
          render: (actions, all) => {
            const btnStyle = {
              padding: 0,
              width: 24,
              height: 24
            };

            return (
              <div>
                <IconButton tooltip="Edit"
                            tooltipPosition="top-center"
                            style={btnStyle}
                            onClick={() => this.props.onRowEdit(all.id)}>
                  <Edit />
                </IconButton>
                <IconButton tooltip="Delete"
                            tooltipPosition="top-center"
                            style={btnStyle}
                            onClick={() => this.props.onRowDelete(all.id)}>
                  <Delete />
                </IconButton>
              </div>
            );
          },
        },
      ];
    }

    handleFilterValueChange = (value) => {
      // your filter logic
    }

    handleSortOrderChange = (key, order) => {
      // your sort logic
    }

    render() {
      const { character } = this.props;

      if (!character.isLoaded) {
        return <LoadingWidget />
      } else if (character.items.length === 0) {
        return <div style={{paddingTop: 20}}>You have no characters</div>
      }

      return (
          <DataTables
            height={'auto'}
            selectable={false}
            showRowHover={true}
            columns={this.TABLE_COLUMNS}
            data={character.items}
            showCheckboxes={false}
            showFooterToolbar={false}
            onCellClick={this.handleCellClick}
            onCellDoubleClick={this.handleCellDoubleClick}
            onFilterValueChange={this.handleFilterValueChange}
            page={1}
            count={character.count}
          />
      );
    }
}

const mapStateToProps = (state) => {
    return {
        character: state.character,
        characterClasses: state.characterClasses,
        profile: state.profile,
    };
};

export default connect(mapStateToProps)(CharacterTable);
export { CharacterTable as CharacterTable };
