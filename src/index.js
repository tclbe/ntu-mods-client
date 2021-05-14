import React from "react"
import ReactDOM from "react-dom"
import TimetableApp from "./TimetableApp"
import "bootstrap/dist/css/bootstrap.min.css"
import * as serviceWorker from "./serviceWorker"

let semester = "2021/2"

ReactDOM.render(
  <React.StrictMode>
    <TimetableApp semester={semester} />
  </React.StrictMode>,
  document.getElementById("root")
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
