import React from 'react';

export default class ModuleInfoCard extends React.PureComponent {
  render() {
    const {
      modulename: moduleName,
      modulecode: moduleCode,
      modulenote: moduleNote,
      academicunits: academicUnits,
      selectedindex: selectedIndex,
    } = this.props;

    // Remains pure despite array prop 'indexes' since number of indexes do not change
    const indexNumbers = this.props.indexes.map((index) => index.indexNumber);

    return (
      <div className="col mb-4">
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col">
                <h5 className="card-title text-primary">{moduleCode}</h5>
              </div>
              <div className="col text-right text-muted">
                <span className="align-top">{academicUnits}AUs</span>
              </div>
            </div>
            <h6 className="card-subtitle text-muted">
              {moduleName}
              {moduleNote}
            </h6>
            <select
              name="activeIndex"
              value={selectedIndex}
              modulecode={moduleCode}
              className="custom-select"
              onChange={this.props.onChange}
            >
              {indexNumbers.sort().map((indexNumber) => {
                return (
                  <option value={indexNumber} key={indexNumber}>
                    {indexNumber}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              modulecode={moduleCode}
              onClick={this.props.onDelete}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }
}
