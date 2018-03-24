import React, {Component} from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import AttendedIcon from 'material-ui/svg-icons/action/check-circle';
import UnavailableIcon from 'material-ui/svg-icons/content/remove-circle';
import UnknownIcon from 'material-ui/svg-icons/action/help';


class AvailabilityTable extends React.Component {
  constructor(props) {
    super(props);

    this.availableIcon = <AttendedIcon color="rgba(180,228,191,1)" />;
    this.unavailableIcon = <UnavailableIcon color="rgba(253,194,139,1)" />;
    this.unknownIcon = <UnknownIcon color="rgba(191, 191, 191,1)" />;

    this.days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    this.state = {
      availability: {
        "Sunday": 2,
        "Monday": 2,
        "Tuesday": 2,
        "Wednesday": 2,
        "Thursday": 2,
        "Friday": 2,
        "Saturday": 2,
        ...props.initialValues,
      }
    }
  }

  handleAvailabilityChange(day, value) {
    const { onChange } = this.props;
    const new_availability = this.state.availability;
    new_availability[day] = value;

    this.setState({
      availability: new_availability
    })

    onChange && onChange(new_availability);
  }

  renderAvailabilityToggle(day) {
    const { availability } = this.state;
    const value = availability[day];
    const icon = (value == 0 && this.availableIcon) || (value == 1 && this.unavailableIcon) || this.unknownIcon;

    return (
      <IconMenu iconButtonElement={<IconButton>{icon}</IconButton>}
                value={value}
                onChange={(e, newValue) => this.handleAvailabilityChange(day, newValue)}>
        <MenuItem primaryText="Available"
                  value={0} />
        <MenuItem primaryText="Unavailable"
                  value={1} />
        <MenuItem primaryText="Unknown"
                  value={2} />
      </IconMenu>
    );
  }

  render() {
    return (
      <Table selectable={false}>
        <TableHeader adjustForCheckbox={false}
                     displaySelectAll={false}>
          <TableRow>
            {
              this.days.map((day, index) => <TableHeaderColumn key={index}>{day}</TableHeaderColumn>)
            }
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          <TableRow>
            {
              this.days.map((day, index) => {
                return (
                  <TableRowColumn key={index}>
                    { this.renderAvailabilityToggle(day) }
                  </TableRowColumn>
                )
              })
            }
          </TableRow>
        </TableBody>
      </Table>
    );
  }
}

AvailabilityTable.propTypes = {
  onChange: PropTypes.func,
  readonly: PropTypes.bool,
  initialValues: PropTypes.object,
};

AvailabilityTable.defaultProps = {
  readonly: false,
  initialValues: {},
}

export default connect()(AvailabilityTable);
