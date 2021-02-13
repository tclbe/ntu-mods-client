import React from 'react';

export default class ClassInfoCard extends React.PureComponent {
  render() {
    const {
      day,
      group,
      type,
      timestart: timeStart,
      timeend: timeEnd,
      venue,
      indexnumber: indexNumber,
      modulecode: moduleCode,
    } = this.props;
    const colour = this.props.modulecolours[moduleCode];
    const colourString = `hsl(${colour[0]},${colour[1] * 100}%,${
      colour[2] * 100
    }%)`;

    return (
      <div
        className={this.props.cardclass}
        style={{
          backgroundColor: colourString,
        }}
        onClick={(e) => this.props.onClick(e, moduleCode, indexNumber)}
        modulecode={moduleCode}
      >
        <div className="card-body p-1 text-left">
          <p
            className="class-text m-0 mt-n1 font-weight-bolder"
            modulecode={moduleCode}
          >
            {moduleCode}
          </p>
          <p className="class-text small mt-n1 mb-n1" modulecode={moduleCode}>
            {type} {group}
          </p>
          <p className="class-text small mt-n1 mb-n1" modulecode={moduleCode}>
            {indexNumber}
          </p>
          <p className="class-text small mb-n1" modulecode={moduleCode}>
            {venue}
          </p>
        </div>
      </div>
    );
  }
}
