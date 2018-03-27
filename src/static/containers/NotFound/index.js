import React from 'react';

export default class NotFoundView extends React.Component {
  render() {
    return (
      <div style={{height: "100%", position: "absolute", width: "100%"}}>
        <div style={{height: "100%", position: "relative", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column"}}>
          <h1 style={{fontSize: "8rem"}}>404</h1>
          <span>Return to whence you came</span>
        </div>
      </div>
    );
  }
}
