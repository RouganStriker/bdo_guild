import PropTypes from 'prop-types';
import React from 'react';
import DataTables from 'material-ui-datatables';
import { MuiThemeProvider } from 'material-ui/styles';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import defaultTheme from '../../muitheme';
const naturalSort = require("javascript-natural-sort");
naturalSort.insensitive = true;


class AttendanceTable extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      items: props.attendance,
      selectedRows: [],
      totalItemCount: props.attendance.length,
      query: {
        pageSize: 16,
        page: 1,
        sortColumn: 'role',
        ordering: 'asc'
      }
    };
  }

  componentWillMount() {
    this.handleQueryUpdate(this.state.query);
  }

  componentWillReceiveProps(nextProps) {
    // Update table items stored in the state before rendering
    this.handleQueryUpdate(this.state.query, nextProps.attendance);
  }

  handleQueryUpdate(query, items = null) {
    const { attendance, onSelectionChange } = this.props;
    const { selectedRows } = this.state;
    const newQuery = {
      ...this.state.query,
      ...query,
    };
    const selectedMember = selectedRows.length === 0 ? null : this.state.items[selectedRows[0]];
    const unfiltered_items = items || attendance;
    const sorted_items = this.applySorting(newQuery, unfiltered_items);
    const paginated_items = this.applyPagination(newQuery, sorted_items);
    const newState = {
      query: newQuery,
      items: paginated_items,
      totalItemCount: unfiltered_items.length,
    }

    const newSelectedRow = paginated_items.indexOf(selectedMember)

    if (selectedMember && newSelectedRow === -1) {
      newState.selectedRows = []
      onSelectionChange && onSelectionChange(null);
    } else if(newSelectedRow > -1) {
      newState.selectedRows = [newSelectedRow]
    }

    this.setState(newState);
  }

  applySorting(query, items = []) {
    const { sortColumn, ordering } = query;

    if (!sortColumn) {
      return items;
    }

    items.sort((a, b) => {
      return naturalSort(a[sortColumn], b[sortColumn])
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
    const { showAssignment, showCharacterDetails, showNote, showRenegeRate } = this.props;
    const columns = [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        style: {
          width: 150,
        },
        render: (name, all) => {
          return <div className="truncate-text">{name}</div>;
        }
      },

    ];

    if (showCharacterDetails) {
      columns.push({
        key: 'class',
        label: 'Class',
        sortable: true,
        style: {
          width: 120,
        },
      })
      columns.push({
        key: 'gearscore',
        label: 'Gearscore',
        sortable: true,
        style: {
          width: 120,
        },
      })
    }
    if (showAssignment) {
      columns.push({
        key: 'team',
        label: 'Team',
        sortable: true,
        style: {
          width: 75,
        },
      })
      columns.push({
        key: 'call_sign',
        label: 'Call Sign',
        sortable: true,
        style: {
          width: 75,
        },
      })
    }
    if (showNote) {
      columns.push({
        key: 'note',
        label: 'Note',
        sortable: false,
        style: {
          width: 200,
        },
        render: (note, all) => {
          return (
            <div style={{width: 230, whiteSpace: "pre-wrap"}}>{note}</div>
          );
        }
      })
    }
    if (showRenegeRate) {
      columns.push({
        key: 'renege_rate',
        label: 'Flake Rate',
        sortable: true,
        style: {
          width: 75,
        },
        render: (renege_rate, all) => {
          return `${(renege_rate * 100).toFixed(2)}%`;
        }
      })
    }

    return columns;
  }

  handleRowSelection(rows) {
    const { onSelectionChange } = this.props;
    const { items } = this.state;
    const newSelected = rows.length === 0 ? null : items[rows[0]];

    this.setState({selectedRows: rows});

    onSelectionChange && onSelectionChange(newSelected)
  }

  handleCellDoubleClick(event, colIndex, value) {
    const { onSelectionDoubleClick } = this.props;
    const { items } = this.state;

    onSelectionDoubleClick && onSelectionDoubleClick(value);
  }

  render() {
    const { handleMemberSelection, selectable, title, toolbarActions } = this.props;
    const {
      items,
      selectedRows,
      totalItemCount,
      query: { page, pageSize }
    } = this.state;
    const muiTheme = getMuiTheme({
      ...defaultTheme,
      tableRow: {
        hoverColor: "rgb(224, 224, 224)",
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
                    onCellDoubleClick={this.handleCellDoubleClick.bind(this)}
                    onNextPageClick={() => this.handleQueryUpdate({page: this.state.query.page + 1})}
                    onPreviousPageClick={() => this.handleQueryUpdate({page: this.state.query.page - 1})}
                    onRowSelection={this.handleRowSelection.bind(this)}
                    onRowSizeChange={(index, pageSize) => this.handleQueryUpdate({ page: 1, pageSize })}
                    onSortOrderChange={(key, order) => this.handleQueryUpdate({
                      sortColumn: key,
                      ordering: order,
                    })}
                    page={page}
                    rowSize={pageSize}
                    rowSizeList={[8, 16, 32, 64]}
                    selectable={selectable}
                    selectedRows={selectedRows}
                    showCheckboxes={false}
                    showFooterToolbar={true}
                    showHeaderToolbar={!!title || !!toolbarActions  }
                    showHeaderToolbarFilterIcon={false}
                    showRowHover={selectable}
                    tableBodyStyle={{overflowX: 'auto'}}
                    title={title}
                    toolbarIconRight={toolbarActions} />
      </MuiThemeProvider>
    )
  }
}

AttendanceTable.propTypes = {
  attendance: PropTypes.array.isRequired,
  onSelectionChange: PropTypes.func,
  onSelectionDoubleClick: PropTypes.func,
  showAssignment: PropTypes.bool,
  showCharacter: PropTypes.bool,
  showNote: PropTypes.bool,
  showRenegeRate: PropTypes.bool,
  selectable: PropTypes.bool,
  title: PropTypes.string,
  toolbarActions: PropTypes.array,
};

AttendanceTable.defaultProps = {
  showAssignment: false,
  showCharacterDetails: false,
  showNote: false,
  showRenegeRate: false,
  selectable: false,
  title: null,
  toolbarActions: null,
};

export default AttendanceTable