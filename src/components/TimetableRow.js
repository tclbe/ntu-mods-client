import React from 'react';
import ClassInfoCard from './ClassInfoCard';

export default class TimetableRow extends React.Component {
  // Receive mainly two things:
  // classes: array containing classInfos that happen on the day.
  // day: one of 'Fri', 'Mon', etc, in sentence case.

  render() {
    // Create copies of the state object passed because I use .pop().
    const classes = JSON.parse(JSON.stringify(this.props.classes));

    // Cut off one so that row doesn't overflow
    const periods = this.props.periods.slice(0, this.props.periods.length - 1);
    const classesByPeriod = {};
    const possibleDays = [];

    // Sort into each period.
    for (let classInfo of classes) {
      const timeStart = classInfo.timeStart;
      if (classesByPeriod.hasOwnProperty(timeStart)) {
        // Append to existing entry
        classesByPeriod[timeStart].push(classInfo);
      } else {
        // Create period entry
        classesByPeriod[timeStart] = [classInfo];
      }
    }

    // And then from there generate the timetables.
    // Goes through the day chronologically - period by period.
    // Each cycle through will produce one possible day.
    while (Object.values(classesByPeriod).some((period) => period.length > 0)) {
      const possibleDay = {};
      for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        if (!classesByPeriod.hasOwnProperty(period)) {
          // If there's no classes in the period, create an empty period.
          possibleDay[period] = {};
        } else {
          // Otherwise get a class.
          const classInfo = classesByPeriod[period].pop();
          // If it's the last class, remove the period entry (I don't remember why this is needed)
          if (classesByPeriod[period].length === 0)
            delete classesByPeriod[period];
          const classStart = classInfo.timeStart;
          const classEnd = classInfo.timeEnd;
          classInfo.duration = (classEnd - classStart) / 100;
          possibleDay[period] = classInfo;
          // If it's longer than 1 period, skip to checking for the next period.
          // e.g. Class is 08:30 to 10:30, skip checking 9:30 for this day.
          if (classInfo.duration > 1) {
            i += classInfo.duration - 1;
          }
        }
      }
      possibleDays.push(possibleDay);
    }

    if (possibleDays.length === 0) {
      const emptyClasses = {};
      periods.map((period) => (emptyClasses[period] = []));
      possibleDays.push(emptyClasses);
    }

    return possibleDays.map((possibleDay, n) => {
      return (
        <tr key={`${this.props.day}${n}`}>
          {/* Table header */}
          {n === 0 && (
            <th
              scope="row"
              colSpan="2"
              rowSpan={possibleDays.length}
              className="border-right align-middle"
            >
              {this.props.day}
            </th>
          )}
          {Object.entries(possibleDay)
            .sort()
            .map(([period, classInfo]) => {
              const duration = classInfo.duration ? classInfo.duration : 1;
              const className = 'border-right p-0';
              // Highlight module being changed.
              const cardClass =
                classInfo.moduleCode === this.props.modulehighlight
                  ? 'small card p-0 bg-primary'
                  : 'small card p-0';
              return (
                <td className={className} colSpan={2 * duration} key={period}>
                  {classInfo.moduleCode && (
                    <ClassInfoCard
                      cardclass={cardClass}
                      modulehighlight={this.props.modulehighlight}
                      modulecolours={this.props.modulecolours}
                      day={classInfo.day}
                      group={classInfo.group}
                      type={classInfo.type}
                      timestart={classInfo.timeStart}
                      timeend={classInfo.timeEnd}
                      venue={classInfo.venue}
                      indexnumber={classInfo.indexNumber}
                      modulecode={classInfo.moduleCode}
                      onClick={this.props.clickhandler}
                    />
                  )}
                </td>
              );
            })}
          <td />
        </tr>
      );
    });
  }
}
