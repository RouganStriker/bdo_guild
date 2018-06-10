import React, {Component} from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import Popover, {PopoverAnimationVertical} from 'material-ui/Popover';
import Checkbox from 'material-ui/Checkbox';
import Menu from 'material-ui/Menu';
import HideIcon from 'material-ui/svg-icons/action/visibility';
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
        ordering: 'asc',
      },
      filterColumns: {
        "class": true,
        "level": true,
        "gearscore": true,
        "attendance": true,
        "attendanceRate": true,
        "command_post": false,
        "fort": false,
        "gate": false,
        "help": false,
        "mount": false,
        "placed_objects": false,
        "guild_master": false,
        "officer": false,
        "member": false,
        "death": false,
        "siege_weapons": false,
        "total_kills": true,
        "kdr": true,
      },
      showColumnDialog: false,
      anchorEl: null,
    };

    this.columnKeyMapping = {
      "class": "Class",
      "level": "Level",
      "gearscore": "Renown",
      "attendance": "Attendance",
      "attendanceRate": "Attendance Rate",
      "command_post": "Command Post",
      "fort": "Fort",
      "gate": "Gate",
      "help": "Help",
      "mount": "Mount",
      "placed_objects": "Placed Objects",
      "guild_master": "Guild Master",
      "officer": "Officer",
      "member": "Member",
      "death": "Death",
      "siege_weapons": "Siege Weapons",
      "total_kills": "Total Kills",
      "kdr": "KDR",
    }
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
      search,
      sortColumn,
      ordering,
    } = query;

    let order = sortColumn === 'name' ? sortColumn : `${sortColumn},name`;
    if (ordering === 'desc') {
      order = `-${order}`;
    }

    const params = {
      expand: "role",
      include: "stats,main_character",
      page,
      page_size: pageSize,
      ordering: order,
    }

    if (search) {
      params["search"] = search;
    }

    dispatch(MemberService.list({ context: { guild_id }, params }))
  }
  componentWillMount() {
    const { dispatch } = this.props;

    dispatch(MemberService.clearLoaded());

    this.fetchMembers();
  }

  getColumns() {
    const { filterColumns } = this.state;
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
    ];

    const classColumn = {
      key: 'className',
      label: 'Class',
      sortable: true,
      style: {width: 100},
      render: (_, all) => {
        return all.main_character.class;
      }
    }
    const levelColumn = {
      key: 'level',
      label: 'Level',
      sortable: true,
      style: {width: 100},
      render: (_, all) => {
        return all.main_character.level;
      }
    }
    const gearscoreColumn = {
      key: 'gearscore',
      label: 'Gearscore',
      sortable: true,
      style: {width: 130},
      render: (_, all) => {
        return all.main_character.gearscore;
      }
    }
    const attendanceColumn = {
      key: 'attendance',
      label: 'Attendance',
      sortable: false,
      style: {width: 120},
      render: (_, all) => {
        const { wars_attended, wars_unavailable, wars_missed } = all.stats;
        return (
          <Tooltip label='Attended / Unavailable / Missed'>
            {[wars_attended, wars_unavailable, wars_missed].join(" / ")}
          </Tooltip>
        );
      }
    }
    const attendanceRateColumn = {
      key: 'attendance_rate',
      label: 'Attendance Rate',
      sortable: true,
      style: {width: 120},
      render: (attendance_rate, all) => {
        return (
          <Tooltip label='(attended + available * 0.5) / total wars'>
            {`${(attendance_rate * 100).toFixed(2)}%`}
          </Tooltip>
        );
      }
    }
    const commandPostColumn = {
      key: 'command_post',
      label: 'Command Post',
      sortable: true,
      style: {width: 150},
      render: (_, all) => {
        return all.stats.command_post;
      }
    }
    const fortColumn = {
      key: 'fort',
      label: 'Fort',
      sortable: true,
      style: {width: 100},
      render: (_, all) => {
        return all.stats.fort;
      }
    }
    const gateColumn = {
      key: 'gate',
      label: 'Gate',
      sortable: true,
      style: {width: 100},
      render: (_, all) => {
        return all.stats.gate;
      }
    }
    const helpColumn = {
      key: 'help',
      label: 'Help',
      sortable: true,
      style: {width: 100},
      render: (_, all) => {
        return all.stats.help;
      }
    }
    const mountColumn = {
      key: 'mount',
      label: 'Mount',
      sortable: true,
      style: {width: 100},
      render: (_, all) => {
        return all.stats.mount;
      }
    }
    const placedObjectColumn = {
      key: 'placed_objects',
      label: 'Placed Object',
      sortable: true,
      style: {width: 150},
      render: (_, all) => {
        return all.stats.placed_objects;
      }
    }
    const guildMasterColumn = {
      key: 'guild_master',
      label: 'Guild Master',
      sortable: true,
      style: {width: 150},
      render: (_, all) => {
        return all.stats.guild_master;
      }
    }
    const officerColumn = {
      key: 'officer',
      label: 'Officer',
      sortable: true,
      style: {width: 120},
      render: (_, all) => {
        return all.stats.officer;
      }
    }
    const memberColumn = {
      key: 'member',
      label: 'Member',
      sortable: true,
      style: {width: 120},
      render: (_, all) => {
        return all.stats.member;
      }
    }
    const deathColumn = {
      key: 'death',
      label: 'Death',
      sortable: true,
      style: {width: 100},
      render: (_, all) => {
        return all.stats.death;
      }
    }
    const siegeWeaponsColumn = {
      key: 'siege_weapons',
      label: 'Siege Weapons',
      sortable: true,
      style: {width: 160},
      render: (_, all) => {
        return all.stats.siege_weapons;
      }
    }
    const totalKillsColumn = {
      key: 'total_kills',
      label: 'Total Kills',
      sortable: true,
      style: {width: 140},
      render: (_, all) => {
        return all.stats.total_kills;
      }
    }
    const kdrColumn = {
      key: 'kdr',
      label: 'KDR',
      sortable: true,
      style: {width: 100},
      render: (_, all) => {
        return all.stats.kdr;
      }
    }

    // Add columns
    filterColumns.class && columns.push(classColumn);
    filterColumns.level && columns.push(levelColumn);
    filterColumns.gearscore && columns.push(gearscoreColumn);
    filterColumns.attendance && columns.push(attendanceColumn);
    filterColumns.attendanceRate && columns.push(attendanceRateColumn);
    filterColumns.command_post && columns.push(commandPostColumn);
    filterColumns.fort && columns.push(fortColumn);
    filterColumns.gate && columns.push(gateColumn);
    filterColumns.help && columns.push(helpColumn);
    filterColumns.mount && columns.push(mountColumn);
    filterColumns.placed_object && columns.push(placedObjectColumn);
    filterColumns.guild_master && columns.push(guildMasterColumn);
    filterColumns.officer && columns.push(officerColumn);
    filterColumns.member && columns.push(memberColumn);
    filterColumns.death && columns.push(deathColumn);
    filterColumns.siege_weapons && columns.push(siegeWeaponsColumn);
    filterColumns.total_kills && columns.push(totalKillsColumn);
    filterColumns.kdr && columns.push(kdrColumn);

    return columns;
  }

  handleQueryUpdate(query, items = null) {
    const newQuery = {
      ...this.state.query,
      ...query,
    };

    this.setState({ query: newQuery});

    this.fetchMembers(newQuery);
  }

  renderHideColumnDialog() {
    const {
      anchorEl,
      filterColumns,
      showColumnDialog,
    } = this.state;

    const wrapperStyle = {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 15,
      width: 400,
    };

    return (
      <Popover open={showColumnDialog}
               animation={PopoverAnimationVertical}
               anchorEl={anchorEl}
               anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
               targetOrigin={{horizontal: 'left', vertical: 'top'}}
               onRequestClose={() => this.setState({showColumnDialog: false})}>

          <Menu listStyle={wrapperStyle}>
            {
              Object.keys(filterColumns).map((key, index) => {
                const column = filterColumns[key];

                return <Checkbox label={this.columnKeyMapping[key]}
                                 checked={filterColumns[key]}
                                 onCheck={() => {
                                   const newFilterColumns = {
                                     ...filterColumns
                                   };
                                   newFilterColumns[key] = !filterColumns[key];

                                   this.setState({
                                     filterColumns: newFilterColumns
                                   })
                                 }}
                                 style={{width: '50%'}} />
              })
            }
          </Menu>
      </Popover>
    );
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

    const tableActions = [
      <IconButton onClick={(e) => this.setState({showColumnDialog: true, anchorEl: e.currentTarget})}>
        <HideIcon />
      </IconButton>
    ];

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
                    onFilterValueChange={(value) => this.handleQueryUpdate({ search: value })}
                    page={page}
                    rowSize={pageSize}
                    rowSizeList={[8, 16, 32, 64]}
                    selectable={true}
                    selectedRows={null}
                    showCheckboxes={false}
                    showFooterToolbar={true}
                    showHeaderToolbar={true}
                    toolbarIconRight={tableActions}
                    showHeaderToolbarFilterIcon={true}
                    showRowHover={true}
                    tableBodyStyle={{overflowX: 'none', overflowY: 'none'}} />
        { this.renderHideColumnDialog() }
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