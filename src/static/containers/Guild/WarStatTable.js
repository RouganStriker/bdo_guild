import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import DataTables from 'material-ui-datatables';
import { MuiThemeProvider } from 'material-ui/styles';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import Time from '../../components/Time';
import ConquestIcons from './images/conquest_icons.png';

const naturalSort = require("javascript-natural-sort");
naturalSort.insensitive = true;


class WarStatTable extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      items: props.items,
      selectedRows: [],
      totalItemCount: props.items.length,
      query: {
        pageSize: 8,
        page: 1,
        sortColumn: 'name',
        ordering: 'asc'
      }
    };
  }

  componentWillMount() {
    this.handleQueryUpdate(this.state.query);
  }

  componentWillReceiveProps(nextProps) {
    // Update table items stored in the state before rendering
    this.handleQueryUpdate(this.state.query, nextProps.items);
  }

  handleQueryUpdate(query, _items = null) {
    const { items, onSelectionChange } = this.props;
    const { selectedRows } = this.state;
    const newQuery = {
      ...this.state.query,
      ...query,
    };

    const unfiltered_items = _items || items;
    const sorted_items = this.applySorting(newQuery, unfiltered_items);
    const paginated_items = this.applyPagination(newQuery, sorted_items);
    const newState = {
      query: newQuery,
      items: paginated_items,
      totalItemCount: unfiltered_items.length,
    }

    window.dispatchEvent(new Event('resize'))

    this.setState(newState);
  }

  applySorting(query, items = []) {
    const { sortColumn, ordering } = query;

    if (!sortColumn) {
      return items;
    }

    items.sort((a, b) => {
      return naturalSort(a[sortColumn], b[sortColumn]) || naturalSort(a['name'], b['name']);
    });

    if (ordering === 'desc') {
      items.reverse();
    }

    return items;

  }

  applyPagination(query, items = []) {
    return items.slice(query.pageSize * (query.page - 1), query.pageSize * query.page);
  }

  handleSortOrderChange = (key, order) => {
    this.handleQueryUpdate({
      sortColumn: key,
      ordering: order,
    })
  }

  getColumns() {
    const {
      sortable,
      showName,
      showDate,
      showGuild,
    } = this.props;

    const iconStyle = {
      objectFit: 'none',
      transform: 'scale(0.7, 0.7)',
      position: 'relative',
      left: -5,
      width: 30,
      height: 40,
    }
    const columnOptions = {
      sortable: sortable,
      style: {
        width: 40
      }
    }

    let columns = [
      {
        key: 'command_post',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '0 0'}} />,
        tooltip: 'Command Post',
        ...columnOptions,
      },
      {
        key: 'fort',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-61px 0'}} />,
        tooltip: 'Fortress',
        ...columnOptions,
      },
      {
        key: 'gate',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-126px 0'}} />,
        tooltip: 'Gate',
        ...columnOptions,
      },
      {
        key: 'help',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-193px 0'}} />,
        tooltip: 'Help',
        ...columnOptions,
      },
      {
        key: 'mount',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-253px 0'}} />,
        tooltip: 'Mount',
        ...columnOptions,
      },
      {
        key: 'placed_objects',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-319px 0'}} />,
        tooltip: 'Placed Objects',
        ...columnOptions,
      },
      {
        key: 'guild_master',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-384px 0'}} />,
        tooltip: 'Guild Master',
        ...columnOptions,
      },
      {
        key: 'officer',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-448px 0'}} />,
        tooltip: 'Officer',
        ...columnOptions,
      },
      {
        key: 'member',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-512px 0'}} />,
        tooltip: 'Member',
        ...columnOptions,
      },
      {
        key: 'death',
        label: <img src={ConquestIcons} style={{...iconStyle, objectPosition: '-575px 0'}} />,
        tooltip: 'Death',
        ...columnOptions,
      },
      {
        key: 'siege_weapons',
        label: <img src={ConquestIcons} style={{...iconStyle, width: 40, objectPosition: '-635px 0'}} />,
        tooltip: 'Siege Weapons',
        ...columnOptions,
      },
      {
        key: 'total_kills',
        label: "Kills",
        ...columnOptions,
        render: (kills, all) => {
          if (kills !== undefined) {
            return kills;
          }
          return all.guild_master + all.officer + all.member + all.siege_weapons;
        }
      },
      {
        key: 'kdr',
        label: "KDR",
        ...columnOptions,
        render: (kdr, all) => {
          if (kdr !== undefined) {
            return kdr;
          }
          return parseFloat((all.guild_master + all.officer + all.member + all.siege_weapons) / all.death).toFixed(2);
        }
      },
    ];

    if (showName) {
      columns = [{
        key: 'name',
        label: 'Name',
        sortable: sortable,
        style: {
          width: 250,
        }
      }, ...columns];
    }
    if (showGuild) {
      columns = [{
        key: 'war',
        label: 'Guild',
        sortable: sortable,
        style: {
          width: 250,
        },
        render: (war) => {
          return war.guild;
        }
      }, ...columns];
    }
    if (showDate) {
      columns = [{
        key: 'war',
        label: 'Date',
        sortable: sortable,
        style: {
          width: 250,
        },
        render: (war) => {
          return <Time>{war.date}</Time>;
        }
      }, ...columns];
    }

    return columns;
  }

  render() {
    const {
      items,
      selectedRows,
      totalItemCount,
      query: { page, pageSize }
    } = this.state;
    const {
      sortable,
    } = this.props;

    const muiTheme = getMuiTheme({
      tableRow: {
        hoverColor: "rgb(224, 224, 224)",
      },
      tableHeaderColumn: {
        spacing: 12,
      },
      tableRowColumn: {
        spacing: 12,
      }
    });

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <DataTables initialSort={{
                      column: 'name',
                      order: 'asc',
                    }}
                    columns={this.getColumns()}
                    count={totalItemCount}
                    data={items}
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
                    showCheckboxes={false}
                    showFooterToolbar={sortable}
                    showHeaderToolbar={false}
                    showHeaderToolbarFilterIcon={false}
                    showRowHover={true}
                    tableBodyStyle={{
                      overflowX: 'auto'
                    }}
                    tableStyle={{
                      width: 'initial'
                    }} />
      </MuiThemeProvider>
    )
  }
}

WarStatTable.propTypes = {
  items: PropTypes.array.isRequired,
  sortable: PropTypes.bool,
  showDate: PropTypes.bool,
  showGuild: PropTypes.bool,
  showName: PropTypes.bool,
};

WarStatTable.defaultProps = {
  sortable: true,
  showName: true,
  showGuiid: false,
  showDate: false,
}

export default WarStatTable;