import React, {Component} from 'react';
import PropTypes from 'prop-types';
import MUITooltip from 'material-ui/internal/Tooltip';


class Tooltip extends Component {
  state = {
    tooltipShown: false,
  };

  showTooltip() {
    this.setState({tooltipShown: true});
  }

  hideTooltip() {
    this.setState({tooltipShown: false});
  }

  handleMouseLeave = (event) => {
    this.hideTooltip();
  };

  handleMouseEnter = (event) => {
    this.showTooltip();
  };

  render() {
    const {
      label,
      tooltipPosition,
    } = this.props;

    const _tooltipPosition = tooltipPosition.split("-");

    return (
      <div style={{display: "inline-block", position: "relative"}}
           onMouseLeave={this.handleMouseLeave}
           onMouseEnter={this.handleMouseEnter}>
        {this.props.children}
        <MUITooltip label={label}
                    show={this.state.tooltipShown}
                    style={{
                      boxSizing: 'border-box',
                      textTransform: 'none',
                    }}
                    verticalPosition={_tooltipPosition[0]}
                    horizontalPosition={_tooltipPosition[1]} />
      </div>
    );
  }
}

Tooltip.propTypes = {
  label: PropTypes.string.isRequired,
  tooltipPosition: PropTypes.string,
};

Tooltip.defaultProps = {
  tooltipPosition: "top-center",
};


export default Tooltip;