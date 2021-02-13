import React from "react"
import axios from "axios"
import ColorHash from "color-hash"
import ModuleInfoCard from "./components/ModuleInfoCard"
import TimetableRow from "./components/TimetableRow"
const URI = "https://c-ntu-mod.herokuapp.com/ntumods/modules"

// Colour generator for colour coding
const colorHash = new ColorHash({
  saturation: [0.5, 0.6, 0.7],
  lightness: [0.7, 0.75, 0.8],
})

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]

export default class TimetableApp extends React.Component {
  constructor() {
    super()
    this.state = {
      searchbarModuleCode: "",
      searchbarPlaceholder: "Enter a module code!",
      periods: [
        "0830",
        "0930",
        "1030",
        "1130",
        "1230",
        "1330",
        "1430",
        "1530",
        "1630",
        "1730",
      ],
      hslColours: {},
      allModuleInfo: {},
      allIndexes: {},
      allClasses: {},
      classesByDay: { mon: [], tue: [], wed: [], thu: [], fri: [] },
      otherClassesByDay: { mon: [], tue: [], wed: [], thu: [], fri: [] },
      activeIndexes: {},
      activeClasses: [],
      moduleBeingChanged: "",
    }
    this.handleSearch = this.handleSearch.bind(this)
    this.handleSearchbarChange = this.handleSearchbarChange.bind(this)
    this.handleDeleteModule = this.handleDeleteModule.bind(this)
    this.handleIndexChange = this.handleIndexChange.bind(this)
    this.handleClassClick = this.handleClassClick.bind(this)
  }

  async handleSearch(e) {
    e.preventDefault()
    const searchbarModuleCode = e.target.moduleCodes.value
    if (this.state.allModuleInfo[searchbarModuleCode]) {
      // If module already exists in state, ignore.
      this.setState({
        searchbarModuleCode: "",
        searchbarPlaceholder: "Already added.",
      })
    } else {
      try {
        this.setState({
          searchbarModuleCode: "",
          searchbarPlaceholder: "Loading...",
        })
        const request = await axios.get(`${URI}/2020/2/${searchbarModuleCode}`)
        this.setState({ searchbarPlaceholder: "Enter a module code!" })
        const { moduleInfo, indexes, classes } = request.data
        const moduleCode = searchbarModuleCode

        // Select first index to generate timetable
        const activeIndex = indexes.sort(
          (a, b) => a.indexNumber - b.indexNumber
        )[0]

        const classesToAdd = classes.filter(
          (classInfo) => classInfo.indexId === activeIndex._id
        )

        // For colour-coding - assign a colour based on the name.
        const hslColour = colorHash.hsl(moduleInfo.moduleName)

        this.setState(
          (state) => ({
            hslColours: {
              ...state.hslColours,
              [moduleCode]: hslColour,
            },
            allModuleInfo: {
              ...state.allModuleInfo,
              [moduleCode]: moduleInfo,
            },
            allIndexes: {
              ...state.allIndexes,
              [moduleCode]: indexes,
            },
            allClasses: {
              ...state.allClasses,
              [moduleCode]: classes,
            },
            activeIndexes: {
              ...state.activeIndexes,
              [moduleCode]: activeIndex,
            },
            activeClasses: [...state.activeClasses, ...classesToAdd],
          }),
          this.updateState
        )
      } catch (error) {
        // Probably some error on server - no matching module code or doesn't fit expected format.
        console.error(error)
        this.setState({
          searchbarModuleCode: "",
          searchbarPlaceholder: "Error occurred, try again?",
        })
      }
    }
  }

  updateState() {
    this.adjustPeriods()
    this.generateClassesByDay()
  }

  adjustPeriods() {
    // Find the latest class
    const timeEnd = this.state.activeClasses.map((classInfo) =>
      Number(classInfo.timeEnd)
    )
    const latestTimeEnd = Math.max(Math.max(...timeEnd), 1730)
    let latestPeriodEnd = Number(
      this.state.periods[this.state.periods.length - 1]
    )

    if (latestPeriodEnd < latestTimeEnd) {
      const periodsToAdd = []
      while (latestPeriodEnd < latestTimeEnd) {
        latestPeriodEnd += 100
        periodsToAdd.push(latestPeriodEnd)
      }
      this.setState((state) => ({
        periods: [...state.periods, ...periodsToAdd],
      }))
    } else if (latestPeriodEnd > latestTimeEnd) {
      // Too many periods. Reduce periods down back to 1730
      const indexOf1730 = this.state.periods.indexOf("1730")
      this.setState((state) => ({
        periods: state.periods.slice(0, indexOf1730 + 1),
      }))
    }
  }

  generateClassesByDay() {
    // Sorts activeClasses by day into classesByDay object.
    // Not sorted by period or anything.
    const classesByDay = {}
    for (let day of days) {
      const activeClassesOnDay = this.state.activeClasses.filter(
        (classInfo) => classInfo.day === day.toUpperCase()
      )
      classesByDay[day.toLowerCase()] = activeClassesOnDay
    }
    this.setState({ classesByDay })
  }

  handleClassClick(e, moduleCode, selectedIndex) {
    const activeIndex = this.state.activeIndexes[moduleCode]

    if (!this.state.moduleBeingChanged) {
      // If this is clicking on a class to change
      this.setState({ moduleBeingChanged: moduleCode })

      // Create a copy of the current timetable
      const otherClassesByDay = JSON.parse(
        JSON.stringify(this.state.classesByDay)
      )

      // Note the lecture group to filter out repeat lecture entries later
      const lecture = this.state.activeClasses.find(
        (classInfo) =>
          classInfo.type === "LEC/STUDIO" && classInfo.moduleCode === moduleCode
      )
      const lectureGroup = lecture ? lecture.group : ""

      for (let day of days) {
        const otherClasses = this.state.allClasses[moduleCode].filter(
          (classInfo) =>
            classInfo.indexNumber !== activeIndex.indexNumber &&
            classInfo.group !== lectureGroup &&
            classInfo.day === day.toUpperCase()
        )
        otherClassesByDay[day.toLowerCase()].push(...otherClasses)
      }

      this.setState({ otherClassesByDay })
    } else if (moduleCode === this.state.moduleBeingChanged) {
      // New index should be selected of the same module, otherwise no change.
      // Selecting the NEW class.
      this.setState({ moduleBeingChanged: "" })

      // Get the new index document
      const newIndexDocument = this.state.allIndexes[moduleCode].find(
        (indexInfo) => indexInfo.indexNumber === selectedIndex
      )

      // Remove old classes by selecting those that aren't in the module
      const newActiveClasses = this.state.activeClasses.filter(
        (classInfo) => classInfo.moduleCode !== moduleCode
      )
      // Get the new classes to add
      const classesToAdd = this.state.allClasses[moduleCode].filter(
        (classInfo) => classInfo.indexNumber === selectedIndex
      )
      newActiveClasses.push(...classesToAdd)

      this.setState(
        (state) => ({
          activeIndexes: {
            ...state.activeIndexes,
            [moduleCode]: newIndexDocument,
          },
          activeClasses: newActiveClasses,
        }),
        this.updateState
      )
    }
  }

  handleIndexChange(e) {
    const moduleCode = e.target.getAttribute("modulecode")
    const oldIndexNumber = this.state.activeIndexes[moduleCode].indexNumber
    const newIndexNumber = e.target.value

    // Find the new index document
    const newIndexDocument = this.state.allIndexes[moduleCode].find(
      (index) => index.indexNumber === newIndexNumber
    )

    // Replace old index document with new one
    this.setState((state) => ({
      activeIndexes: {
        ...state.activeIndexes,
        [moduleCode]: newIndexDocument,
      },
    }))

    // Remove old classes
    const newActiveClasses = this.state.activeClasses.filter(
      (activeClass) => activeClass.indexNumber !== oldIndexNumber
    )

    // Find new classes, and add them.
    const classesToAdd = this.state.allClasses[moduleCode].filter(
      (classInfo) => {
        return classInfo.indexId === newIndexDocument._id
      }
    )
    newActiveClasses.push(...classesToAdd)

    this.setState({ activeClasses: newActiveClasses }, this.updateState)
  }

  handleSearchbarChange(e) {
    const moduleCode = e.target.value
    this.setState({
      searchbarModuleCode: moduleCode,
      searchbarPlaceholder: "Enter a module code!",
    })
  }

  handleDeleteModule(e) {
    const moduleCode = e.target.getAttribute("modulecode")
    const {
      allModuleInfo,
      allIndexes,
      allClasses,
      activeIndexes: newActiveIndexes,
    } = JSON.parse(JSON.stringify(this.state))

    // Delete old modules by filtering out everything that ISN'T the old module.
    const newActiveClasses = this.state.activeClasses.filter(
      (classInfo) => classInfo.moduleCode !== moduleCode
    )

    // Not mutating state, since they're all copies.
    delete allModuleInfo[moduleCode]
    delete allIndexes[moduleCode]
    delete allClasses[moduleCode]
    delete newActiveIndexes[moduleCode]

    this.setState(
      {
        allModuleInfo,
        allIndexes,
        allClasses,
        activeClasses: newActiveClasses,
        activeIndexes: newActiveIndexes,
      },
      this.updateState
    )
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          {/* Timetable */}
          <table className="table text-center" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th scope="col"></th>
                {this.state.periods.map((period, n) => (
                  <th scope="col" colSpan="2" key={n}>
                    {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const classes = this.state.moduleBeingChanged
                  ? this.state.otherClassesByDay[day.toLowerCase()]
                  : this.state.classesByDay[day.toLowerCase()]
                return (
                  <TimetableRow
                    classes={classes}
                    day={day}
                    periods={this.state.periods}
                    modulecolours={this.state.hslColours}
                    modulehighlight={this.state.moduleBeingChanged}
                    clickhandler={this.handleClassClick}
                    key={day}
                  />
                )
              })}
              <tr>
                {/* extra row for aligning cells. */}
                {[...Array(this.state.periods.length * 2 + 1)].map((_, n) => (
                  <td key={n}></td>
                ))}
              </tr>
            </tbody>
          </table>
          {/* End timetable */}
        </div>
        <div className="row">
          {/* Module selection */}
          <div className="container">
            <div className="row">
              {/* Searchbar */}
              <form className="form-inline mb-4" onSubmit={this.handleSearch}>
                <div className="form-group">
                  <label>Module code:</label>
                  <input
                    className="form-control m-2"
                    type="search"
                    name="moduleCodes"
                    value={this.state.searchbarModuleCode}
                    placeholder={this.state.searchbarPlaceholder}
                    onChange={this.handleSearchbarChange}
                  />
                  <button className="btn btn-primary" type="submit">
                    Submit
                  </button>
                </div>
              </form>
              {/* End searchbar */}
            </div>
            {/* Module view */}
            <div className="row row-cols-4">
              {Object.entries(this.state.allModuleInfo).map(
                ([code, moduleInfo]) => {
                  return (
                    <ModuleInfoCard
                      selectedindex={this.state.activeIndexes[code].indexNumber}
                      modulecode={code}
                      modulename={moduleInfo.moduleName}
                      modulenote={moduleInfo.moduleNote}
                      academicunits={moduleInfo.academicUnits}
                      indexes={this.state.allIndexes[code]}
                      onDelete={this.handleDeleteModule}
                      onChange={this.handleIndexChange}
                      key={moduleInfo._id}
                    />
                  )
                }
              )}
            </div>
            {/* End module view */}
          </div>
          {/* End module selecton */}
        </div>
        <div className="row"></div>
      </div>
    )
  }
}
