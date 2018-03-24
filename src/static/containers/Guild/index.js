import React, {Component} from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {Tabs, Tab} from 'material-ui/Tabs';
import DataTables from 'material-ui-datatables';
import Dialog from 'material-ui/Dialog';
import Paper from 'material-ui/Paper';
import GuildEmblemPlaceholder from 'material-ui/svg-icons/social/group';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {BottomNavigation, BottomNavigationItem} from 'material-ui/BottomNavigation';
import ActionAdd from 'material-ui/svg-icons/content/add';
import IconButton from 'material-ui/IconButton';
import ActionUpload from 'material-ui/svg-icons/file/file-upload';
import ActionShowColumns from 'material-ui/svg-icons/action/visibility';
import AttendanceIcon from 'material-ui/svg-icons/editor/show-chart';
import PreWarSetupIcon from 'material-ui/svg-icons/image/edit';
import TextField from 'material-ui/TextField';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import DatePicker from 'material-ui/DatePicker';
import Divider from 'material-ui/Divider';
import areIntlLocalesSupported from 'intl-locales-supported';

import WarService from '../../services/guilds/wars/service';
import WarSetup from './WarSetup'
let DateTimeFormat;

/**
 * Use the native Intl.DateTimeFormat if available, or a polyfill if not.
 */
if (areIntlLocalesSupported(['fr', 'fa-IR'])) {
  DateTimeFormat = global.Intl.DateTimeFormat;
} else {
  const IntlPolyfill = require('intl');
  DateTimeFormat = IntlPolyfill.DateTimeFormat;
  require('intl/locale-data/jsonp/fr');
  require('intl/locale-data/jsonp/fa-IR');
}

class GuildView extends React.Component {
    static propTypes = {
        statusText: PropTypes.string,
        userName: PropTypes.string,
        dispatch: PropTypes.func.isRequired
    };

    static defaultProps = {
        statusText: '',
        userName: ''
    };

    state = {
      dialogOpen: false,
      dialogTitle: null,
      dialogActions: null,
      dialogContent: null,
      selectedIndex: 0,
    };

    handleOpen = (dialogContent, dialogTitle, dialogActions) => {
      this.setState({
        dialogOpen: true,
        dialogContent,
        dialogTitle,
        dialogActions,
      });
    };

    handleClose = () => {
      this.setState({
        dialogOpen: false,
        dialogTitle: null,
        dialogActions: null,
        dialogContent: null,
      });
    };


    handleFilterValueChange = (value) => {
      // your filter logic
    }

    handleSortOrderChange = (key, order) => {
      // your sort logic
    }

    renderTabs() {
      return (
        <Tabs>
          <Tab label="Overview">
            <div style={{margin: 40}}>
              <h2>Tab One</h2>

            </div>
          </Tab>
          <Tab label="Members">
            <div style={{margin: 40}}>

            </div>
          </Tab>
          <Tab label="Node War">
            <div style={{margin: 0}}>
              {this.renderNodeWars()}
            </div>
          </Tab>
          <Tab label="Manage">
            <div style={{margin: 40}}>

            </div>
          </Tab>
        </Tabs>
      );
    }

    handleLoadWarSetup() {
      const { dispatch, war } = this.props;

      if (war.selected === null) {
        dispatch(WarService.get({ id: 1, context: { guild_id: 1 }}));
      }
    }

    renderNodeWars() {
      const attendanceStyleClass = {
        Present: 'attendancePresent',
        MIA: 'attendanceMIA',
        Away: 'attendanceAway',
      }

      const renderAttendance = (attendance, all) => {
        const label = attendance || '-';
        const className = attendanceStyleClass[attendance] || 'attendanceEmpty';

        return <p className={className}>{label}</p>;
      }

      let TABLE_COLUMNS = [
        {
          key: 'familyName',
          label: 'Family Name',
        },
        {
          key: 'date1',
          label: '12/10/2017',
          style: {
            textAlign: 'center',
          },
          render: renderAttendance,
        },
      ];

      for (let i = TABLE_COLUMNS.length; i < 7; i++) {
        TABLE_COLUMNS.push({
            key: 'date' + i,
            label: '-',
            style: {
              textAlign: 'center',
            },
            render: renderAttendance
        });
      }

      const TABLE_DATA = [
        {
          familyName: 'Atrous',
          date1: 'Present',
          date2: 'Away',
          date3: 'MIA',
        },
        {
          familyName: 'Test',
          date1: 'Present',
          date2: 'MIA',
        },
      ];

      const toolbarIcons = [
        <IconButton tooltip="Add">
          <ActionAdd/>
        </IconButton>,
        <IconButton tooltip="Upload">
          <ActionUpload/>
        </IconButton>,
      ];

      const muiTheme = getMuiTheme({
        tableHeaderColumn: {
          spacing: 0,
        },
        tableRowColumn: {
          height: 32,
          spacing: 0,
        },
        tableRow: {
          height: 32,
        }
      });

      const select = (index) => this.setState({selectedIndex: index});

      const renderedAttendance = (
        <MuiThemeProvider muiTheme={muiTheme}>
              <DataTables
                height={'auto'}
                selectable={false}
                showRowHover={true}
                showHeaderToolbar={true}
                showHeaderToolbarFilterIcon={false}
                toolbarIconRight={toolbarIcons}
                columns={TABLE_COLUMNS}
                data={TABLE_DATA}
                showCheckboxes={false}
                onCellClick={this.handleCellClick}
                onCellDoubleClick={this.handleCellDoubleClick}
                onFilterValueChange={this.handleFilterValueChange}
                onSortOrderChange={this.handleSortOrderChange}
                page={1}
                count={1}
              />
        </MuiThemeProvider>
      );

      const { war }  = this.props;

      return (
        <div>
          <div style={{margin: 40}}>
            { this.state.selectedIndex == 0 && renderedAttendance || <WarSetup war={war.selected} />}
          </div>
          <BottomNavigation selectedIndex={this.state.selectedIndex} style={{
                marginTop: 30,
                backgroundColor: 'rgb(236, 236, 236)',
          }}>
            <BottomNavigationItem
              label="Attendance"
              icon={<AttendanceIcon />}
              onClick={() => select(0)}
            />
            <BottomNavigationItem
              label="Pre War Setup"
              icon={<PreWarSetupIcon />}
              onClick={() => {
                this.handleLoadWarSetup()
                select(1)
              }}
            />
          </BottomNavigation>
        </div>
      );
    }

    renderRoster() {
      const TABLE_COLUMNS = [
        {
          key: 'position',
          label: 'Position',
          sortable: true,
        },
        {
          key: 'familyName',
          label: 'Family Name',
          sortable: true,
          style: {
            width: 150,
          }
        },
        {
          key: 'characterName',
          label: 'Character Name',
          sortable: true,
        },
        {
          key: 'class',
          label: 'Class',
          sortable: true,
        },
        {
          key: 'level',
          label: 'Level',
          sortable: true,
        },
        {
          key: 'ap',
          label: 'AP',
          sortable: true,
        },
        {
          key: 'aap',
          label: 'AAP',
          sortable: true,
        },
        {
          key: 'dp',
          label: 'DP',
          sortable: true,
        },
        {
          key: 'gs',
          label: 'GS',
          sortable: true,
        },
        {
          key: 'fortress',
          label: 'Fortress',
          sortable: true,
        },
        {
          key: 'commandPost',
          label: 'Command Post',
          sortable: true,
        },
        {
          key: 'gate',
          label: 'Gate',
          sortable: true,
        },
        {
          key: 'help',
          label: 'Help',
          sortable: true,
        },
        {
          key: 'mount',
          label: 'Mount',
          sortable: true,
        },
        {
          key: 'placedObject',
          label: 'Placed Object',
          sortable: true,
        },
        {
          key: 'guildMaster',
          label: 'Guild Master',
          sortable: true,
        },
        {
          key: 'officer',
          label: 'Officer',
          sortable: true,
        },
        {
          key: 'member',
          label: 'Member',
          sortable: true,
        },
        {
          key: 'deaths',
          label: 'Deaths',
          sortable: true,
        },
        {
          key: 'siegeWeapons',
          label: 'Siege Weapons',
          sortable: true,
        },
        {
          key: 'attendanceCount',
          label: 'Attendance Count',
          sortable: true,
        },
        {
          key: 'totalKills',
          label: 'Total Kills',
          sortable: true,
        },
        {
          key: 'kdr',
          label: 'KDR',
          sortable: true,
        },
      ];

      const TABLE_DATA = [
        {
          position: 0,
          familyName: "Atrous",
          characterName: "Nyfor",
          class: "Valkyrie",
          level: 61,
          ap: 198,
          aap: 205,
          dp: 302,
          gs: 507,
          fortress: 0,
          commandPost: 1,
          gate: 0,
          help: 100,
          mount: 5,
          placedObject: 4,
          guildMaster: 2,
          officer: 15,
          member: 124,
          deaths: 70,
          siegeWeapons: 0,
          attendanceCount: 12,
          totalKills: 150,
          kdr: 1.56,
        },
      ];


      const muiTheme = getMuiTheme({
        tableHeaderColumn: {
          spacing: 7,
        },
        tableRowColumn: {
          spacing: 7,
        }
      });

      const handleShowColumn = () => {
        const dialogContent = (
          <div>
            Hi
          </div>
        );

        this.handleOpen(
          dialogContent,
          'Show Columns'
        );
      };

      const toolbarIcons = [
        <IconButton tooltip="Show Columns">
          <ActionShowColumns onClick={handleShowColumn}/>
        </IconButton>,
      ];


      return (
        <MuiThemeProvider muiTheme={muiTheme}>
          <DataTables
            height={'auto'}
            selectable={false}
            showRowHover={true}
            columns={TABLE_COLUMNS}
            data={TABLE_DATA}
            showHeaderToolbar={true}
            toolbarIconRight={toolbarIcons}
            showCheckboxes={false}
            onCellClick={this.handleCellClick}
            onCellDoubleClick={this.handleCellDoubleClick}
            onFilterValueChange={this.handleFilterValueChange}
            onSortOrderChange={this.handleSortOrderChange}
            page={1}
            count={1}
            tableStyle={{
              tableLayout: 'auto',
            }}
            tableBodyStyle={{
              overflowX: 'scroll',
            }}
          />
        </MuiThemeProvider>
      );
    }

    render() {
        return (
          <div className="container">
            <div style={{
                   marginTop: 30,
                   marginRight: 40,
                   marginLeft: 40,
                   marginBottom: 15,
                 }}>
              <img src="https://cdn.discordapp.com/icons/217417143917084672/4e0e9abdffa5ea904ab417dc412083fe.png"
                   style={{
                     width: 60,
                     height: 60,
                     float: "left",
                     borderRadius: 30,
                     marginRight: 30,
                   }} />
              <h1 style={{
                    fontSize: 60,
                    paddingTop: 2,
                  }}>
                Affect
              </h1>
            </div>

            { this.renderTabs() }

            <Dialog
              title={this.state.dialogTitle}
              modal={false}
              open={this.state.dialogOpen}
              onRequestClose={this.handleClose}
            >
              {this.state.dialogContent}
            </Dialog>
          </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        userName: state.auth.userName,
        statusText: state.auth.statusText,
        war: state.war,
    };
};

export default connect(mapStateToProps)(GuildView);
export { GuildView as GuildView };
