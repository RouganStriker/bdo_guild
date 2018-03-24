import React, {Component} from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DataTables from 'material-ui-datatables';
import Paper from 'material-ui/Paper';
import GuildEmblemPlaceholder from 'material-ui/svg-icons/social/group';
import { Grid } from 'react-bootstrap';

import BaseView from '../../components/BaseView'
import LoadingWidget from '../../components/LoadingWidget';
import {
  GuildService
} from '../../services';


class GuildListView extends React.Component {
  constructor(props) {
    super(props);

    this.TABLE_COLUMNS = [
      {
        key: 'logo_url',
        label: '',
        style: {
          width: 75,
        },
        render: (logo_url, all) => {
          return <img className="emblem" src={logo_url}/>;
        },
      },
      {
        key: 'name',
        label: 'Name',
      },
      {
        key: 'guild_master',
        label: 'Guild Master',
        render: (guild_master, all) => {
          return guild_master.family_name;
        },
      },
      {
        key: 'member_count',
        label: 'Members',
      },
      {
        key: 'average_level',
        label: 'Avg. Level',
      },
      {
        key: 'average_gearscore',
        label: 'Avg. GS',
      },
    ];
  }
  componentWillMount() {
    const { dispatch } = this.props;

    dispatch(GuildService.list({params: { include: 'stats' } }));
  }

  handleFilterValueChange = (value) => {
    // your filter logic
  }

  handleSortOrderChange = (key, order) => {
    // your sort logic
  }

  render() {
    const { guild } = this.props;

    if (!guild.isLoaded) {
      return <LoadingWidget />
    }

    return (
      <BaseView title="Guilds">
        <Grid componentClass={Paper} style={{padding: 0}}>
          <DataTables
            height={'auto'}
            selectable={false}
            showRowHover={true}
            columns={this.TABLE_COLUMNS}
            data={guild.items}
            showCheckboxes={false}
            onCellClick={this.handleCellClick}
            onCellDoubleClick={this.handleCellDoubleClick}
            onFilterValueChange={this.handleFilterValueChange}
            onSortOrderChange={this.handleSortOrderChange}
            page={1}
            count={guild.count}
            tableBodyStyle={{
              overflowY: 'hidden',
            }}
          />
        </Grid>
      </BaseView>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    guild: state.guild,
  };
};

export default connect(mapStateToProps)(GuildListView);
