import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import Paper from 'material-ui/Paper';
import DataTables from 'material-ui-datatables';

import LoadingWidget from '../../components/LoadingWidget';
import Tooltip from '../../components/Tooltip';
import {
  MemberService,
} from '../../services';


class GuildMemberStats extends React.Component {
  constructor(props) {
    super(props);

     this.state = {
      items: [],
      selectedRows: [],
      totalItemCount: props.members.count,
      query: {
        pageSize: 8,
        page: 1,
        sortColumn: 'role',
        ordering: 'asc'
      }
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.members.count != this.state.count) {
      this.setState({totalItemCount: nextProps.members.count})
    }
  }

  fetchMembers(newQuery) {
    const { dispatch, guild_id } = this.props;
    const query = newQuery || this.state.query;
    const {
      page,
      pageSize,
      sortColumn,
      ordering,
    } = query;

    let order = sortColumn === 'name' ? sortColumn : `${sortColumn},name`;
    if (ordering === 'desc') {
      order = `-${order}`;
    }

    dispatch(MemberService.list({ context: { guild_id }, params: {
      expand: "role",
      include: "stats,main_character",
      page,
      page_size: pageSize,
      ordering: order,
    }}))
  }
  componentWillMount() {
    const { dispatch } = this.props;

    dispatch(MemberService.clearLoaded());

    this.fetchMembers();
  }

  getColumns() {
    const columns = [
      {
        key: 'role',
        label: 'Role',
        sortable: true,
        style: {width: 100},
        render: (_, all) => {
          return all.role.name;
        }
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        style: {width: 250},
      },
      {
        key: 'className',
        label: 'Class',
        sortable: true,
        style: {width: 100},
        render: (_, all) => {
          return all.main_character.class;
        }
      },
      {
        key: 'level',
        label: 'Level',
        sortable: true,
        style: {width: 100},
        render: (_, all) => {
          return all.main_character.level;
        }
      },
      {
        key: 'gearscore',
        label: 'Gearscore',
        sortable: true,
        style: {width: 130},
        render: (_, all) => {
          return all.main_character.gearscore;
        }
      },
      {
        key: 'attended',
        label: 'Attendance',
        sortable: false,
        style: {width: 120},
        render: (_, all) => {
          const { total_attended, total_unavailable, total_missed } = all.stats;
          return (
            <Tooltip label='Attended / Unavailable / Missed'>
              {[total_attended, total_unavailable, total_missed].join(" / ")}
            </Tooltip>
          );
        }
      },
      {
        key: 'command_post',
        label: 'Command Post',
        sortable: false,
        style: {width: 150},
        render: (_, all) => {
          return all.stats.total_command_post;
        }
      },
      {
        key: 'fort',
        label: 'Fort',
        sortable: false,
        style: {width: 100},
        render: (_, all) => {
          return all.stats.total_fort;
        }
      },
      {
        key: 'gate',
        label: 'Gate',
        sortable: false,
        style: {width: 100},
        render: (_, all) => {
          return all.stats.total_gate;
        }
      },
      {
        key: 'help',
        label: 'Help',
        sortable: false,
        style: {width: 100},
        render: (_, all) => {
          return all.stats.total_help;
        }
      },
      {
        key: 'mount',
        label: 'Mount',
        sortable: false,
        style: {width: 100},
        render: (_, all) => {
          return all.stats.total_mount;
        }
      },
      {
        key: 'placed_object',
        label: 'Placed Object',
        sortable: false,
        style: {width: 150},
        render: (_, all) => {
          return all.stats.total_placed_objects;
        }
      },
      {
        key: 'guild_master',
        label: 'Guild Master',
        sortable: false,
        style: {width: 150},
        render: (_, all) => {
          return all.stats.total_guild_master;
        }
      },
      {
        key: 'officer',
        label: 'Officer',
        sortable: false,
        style: {width: 120},
        render: (_, all) => {
          return all.stats.total_officer;
        }
      },
      {
        key: 'member',
        label: 'Member',
        sortable: false,
        style: {width: 120},
        render: (_, all) => {
          return all.stats.total_member;
        }
      },
      {
        key: 'death',
        label: 'Death',
        sortable: false,
        style: {width: 100},
        render: (_, all) => {
          return all.stats.total_death;
        }
      },
      {
        key: 'siege_weapons',
        label: 'Siege Weapons',
        sortable: false,
        style: {width: 160},
        render: (_, all) => {
          return all.stats.total_siege_weapons;
        }
      },
      {
        key: 'total_kills',
        label: 'Total Kills',
        sortable: false,
        style: {width: 140},
        render: (_, all) => {
          const {
            total_guild_master,
            total_officer,
            total_member,
            total_siege_weapons,
          } = all.stats;

          return total_guild_master + total_officer + total_member + total_siege_weapons;
        }
      },
      {
        key: 'kdr',
        label: 'KDR',
        sortable: false,
        style: {width: 100},
        render: (_, all) => {
          const {
            total_guild_master,
            total_officer,
            total_member,
            total_siege_weapons,
            total_death,
          } = all.stats;

          return total_death !== 0 && ((total_guild_master + total_officer + total_member + total_siege_weapons) / total_death).toFixed(2) || 0;
        }
      },
    ];

    return columns
  }

  handleQueryUpdate(query, items = null) {
    const newQuery = {
      ...this.state.query,
      ...query,
    };

    this.setState({ query: newQuery});

    this.fetchMembers(newQuery);
  }

  render() {
    const { members } = this.props;
    const {
      items,
      selectedRows,
      totalItemCount,
      query: { page, pageSize }
    } = this.state;

    if (!members.isLoaded || members.items && !members.items[0].stats) {
      return <LoadingWidget />;
    }

    return (
      <Grid componentClass={Paper} style={{padding: 0}}>
        <DataTables initialSort={{
                      column: 'role',
                      order: 'asc',
                    }}
                    columns={this.getColumns()}
                    count={totalItemCount}
                    data={members.items}
                    onNextPageClick={() => this.handleQueryUpdate({page: this.state.query.page + 1})}
                    onPreviousPageClick={() => this.handleQueryUpdate({page: this.state.query.page - 1})}
                    onRowSizeChange={(index, pageSize) => this.handleQueryUpdate({ page: 1, pageSize })}
                    onSortOrderChange={(key, order) => this.handleQueryUpdate({
                      sortColumn: key,
                      ordering: order,
                    })}
                    page={page}
                    rowSize={pageSize}
                    rowSizeList={[8, 16, 32, 64]}
                    selectable={true}
                    selectedRows={null}
                    showCheckboxes={false}
                    showFooterToolbar={true}
                    showHeaderToolbar={false}
                    showHeaderToolbarFilterIcon={false}
                    showRowHover={true}
                    tableBodyStyle={{overflowX: 'none', overflowY: 'none'}} />
      </Grid>
    )
  }
}

const mapStateToProps = (state) => {
  return {
      members: state.members,
  };
};

export default connect(mapStateToProps)(GuildMemberStats)