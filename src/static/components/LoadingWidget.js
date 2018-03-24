import React from 'react';
import LinearProgress from 'material-ui/LinearProgress';
import CircularProgress from 'material-ui/CircularProgress';


class LoadingWidget extends React.Component {
  render() {
    const { style, type } = this.props
    return (
      <div style={{padding: 40, ...style }}>
        { type === 'bar' && <LinearProgress />}
        { type !== 'bar' && <CircularProgress />}
      </div>
    );
  }
}

LoadingWidget.defaultProps = {
  type: 'bar',
};

export default LoadingWidget;
