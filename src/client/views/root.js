import React, {Component} from "react"
import ReactDOM from "react-dom"

import AppBar from 'material-ui/AppBar'
import LinearProgress from 'material-ui/LinearProgress'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import ArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up'
import ArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down'
import Dialog from 'material-ui/Dialog'
import FlatButton from "material-ui/FlatButton"

import Shelf from "./Shelf"
import Search from './Search'
import SettingDrawer from './SettingDrawer'
import {initWikipedia, memberByMember, getRandomPage, searchByTitle} from "../wikipedia"

const COLUMNS_SIZE = 5

export default class Root extends Component {
  constructor(props) {
    super(props)

    this.state = {
      query: "",
      entryClusters: [], //{category: String, entries: [String]}
      columns: [],
      currentCategoryIndex: 0,
      currentEntryIndex: 0,
      drawerOpen: false,
      dialogOpen: true,
      wikipediaOpen: false,
      isLoading: false,
      dataDlProgress: 0
    }

    this.rootStyle = {
      display: "flex",
      flexFlow: "column",
      font: "14px 'Lucida Grande', Helvetica, Arial, sans-serif"
    }

    this.previewTimer = null

  }

  componentDidMount = async () => {
    await initWikipedia((progress) => {
      this.setState({dataDlProgress: progress})
    })
    this.setState({dialogOpen: false})

    const queryFromUrl = decodeURIComponent(location.pathname.replace("/", ""))

    if(queryFromUrl !== ""){
      this.requestQuery(false, queryFromUrl)
    }else {
      this.randomRequest()
    }

    window.addEventListener("keydown", (e) => this.handleKeyDown(e))
  }

  randomRequest = async () => {
    this.setState({
      query: ""
    }, async () => {
      this.requestQuery(true, await getRandomPage())
    })
  }

  requestQuery = async (isJump = false, query = this.currentEntries()[this.state.currentEntryIndex]) => {
    console.log('submit query')
    console.log(query)
    if (!query || query.length === 0 || query === this.state.query) {
      return
    }

    if (isJump) {
      this.setState({
        query: ""
      })
    }

    this.setState({
      isLoading: true
    })

    let categoryIndex
    let entryIndex
    let entryClusters = await memberByMember(query)

    if (entryClusters.length === 0) {
      //サブカテゴリのようにカテゴリが登録されていないページの場合は直前に表示していたカテゴリをそのまま使う
      entryClusters = [this.state.entryClusters[this.state.currentCategoryIndex]]
      categoryIndex = 0
      entryIndex = this.state.currentEntryIndex
    } else {
      //直前にフォーカスしていたカテゴリにピボットする
      categoryIndex = this.state.query === "" ? Math.floor(entryClusters.length / 2) : (() => {
        for (let i = 0; i < entryClusters.length; i++) {
          if (entryClusters[i].category === this.state.entryClusters[this.state.currentCategoryIndex].category) {
            return i
          }
        }
        return 0
      })()
      entryIndex = entryClusters[categoryIndex].entries.indexOf(query)
    }

    console.log(entryClusters)
    console.log(`catIndex: ${categoryIndex} entIndex: ${entryIndex}`)

    this.setState({
      currentCategoryIndex: categoryIndex,
      currentEntryIndex: entryIndex,
      query: query,
      entryClusters: entryClusters,
      isLoading: false
    }, () => {
      this.refreshColumns()
    })

    this.previewTimer = setTimeout(() => {
      this.toggleWikipedia(true)
    }, 3000)
  }

  currentEntries = () => {
    return this.state.entryClusters[this.state.currentCategoryIndex].entries
  }

  currentCategory = () => {
    return this.state.entryClusters[this.state.currentCategoryIndex].category
  }

  handleKeyDown = (e) => {
    if (e.keyCode !== 37 && e.keyCode !== 38 && e.keyCode !== 39 && e.keyCode !== 40 && e.keyCode !== 13) {
      return
    }
    e.preventDefault()
    switch (e.keyCode) {
      case 38: //↑
        if (this.state.currentEntryIndex <= 0) {
          return
        }
        this.setState({
          currentEntryIndex: this.state.currentEntryIndex - 1
        }, () => {
          this.refreshColumns()
        })
        return this.requestQuery()
      case 40: //↓
        if (this.state.currentEntryIndex >= this.currentEntries().length - 1) {
          return
        }
        this.setState({
          currentEntryIndex: this.state.currentEntryIndex + 1
        }, () => {
          this.refreshColumns()
        })
        return this.requestQuery()
      case 37: //←
        //currentCategoryIndex
        if (this.state.currentCategoryIndex <= 0) {
          return
        }
        this.setState({
          currentCategoryIndex: this.state.currentCategoryIndex - 1,
          currentEntryIndex: this.state.entryClusters[this.state.currentCategoryIndex - 1].entries.indexOf(this.state.query)
        })
        return this.refreshColumns()
      case 39: //→
        if (this.state.currentCategoryIndex >= this.state.entryClusters.length - 1) {
          return
        }
        this.setState({
          currentCategoryIndex: this.state.currentCategoryIndex + 1,
          currentEntryIndex: this.state.entryClusters[this.state.currentCategoryIndex + 1].entries.indexOf(this.state.query)
        })
        return this.refreshColumns()
      case 13:
        this.toggleWikipedia()
        return
    }
  }

  refreshColumns = () => {
    const offset = (COLUMNS_SIZE - 1) / 2
    const columns = []
    console.log(offset)

    this.toggleWikipedia(false)

    if (this.state.entryClusters.length === 0) {
      return
    }

    for (let i = 0; i < COLUMNS_SIZE; i++) {
      const isFocus = i === offset
      const cluster = this.state.entryClusters[this.state.currentCategoryIndex - offset + i]

      if (!cluster) {
        columns.push(
            <Shelf
                empty={true}
                rowSize={COLUMNS_SIZE}
            />
        )
        continue
      }

      //currentCategory以外
      const index = isFocus ? this.state.currentEntryIndex : cluster.entries.indexOf(this.state.query)

      columns.push(
          <Shelf
              debugindex={this.state.currentCategoryIndex - offset + i}
              key={`shelf-${i}`}
              rowSize={COLUMNS_SIZE}
              category={cluster ? cluster.category : ""}
              entries={cluster ? cluster.entries : ""}
              isFocus={isFocus}
              index={index}
          />
      )
    }
    console.log('columns updated')
    console.log(columns)

    this.setState({
      columns: columns
    })
    console.log("columns updated")
  }

  toggleDrawer = () => {
    this.setState({
      drawerOpen: !this.state.drawerOpen
    })
  }

  toggleWikipedia = (isOpen) => {
    clearTimeout(this.previewTimer)
    this.setState({
      wikipediaOpen: isOpen === undefined ? !this.state.wikipediaOpen : isOpen
    })
  }

  render = () => {
    console.log("render")
    const wikipedia = (
        <iframe
            src={`https://ja.m.wikipedia.org/wiki/${this.state.query}`}
            style={{
              width: "100%",
              height: "90%",
              border: "none"
            }}
        />
    )

    const appBarChildren = (
        <div style={{display: "flex", justifyContent: "flex-end", width: "100%"}}>
          <Search
              searchByTitle={searchByTitle}
              requestQuery={this.requestQuery}/>
          <FlatButton
              style={{top: 15}}
              labelStyle={{fontSize: 17, color: "white"}}
              label={"おまかせ"}
              onClick={this.randomRequest}/>
        </div>
    )

    const progress = this.state.isLoading ? <LinearProgress mode="indeterminate" style={{
      position: "fixed",
      top: "64",
      left: "-1",
      width: "101%",
      backgroundColor: "#FFF"
    }}/> : ""
    const arrow = this.state.wikipediaOpen ? <ArrowDown/> : <ArrowUp/>

    return (
        <div style={this.rootStyle}>
          <AppBar
              title="Wikipedia Navigator"
              titleStyle={{cursor: "pointer", flex: "0 1 20%", overflow: ""}}
              onLeftIconButtonClick={this.toggleDrawer}
              onTitleClick={this.randomRequest}
              children={appBarChildren}/>
          {progress}
          <div style={{margin: "0 auto", paddingTop: 10, display: "flex"}}>
            {this.state.columns}
          </div>
          <div style={{
            position: "fixed",
            height: "100%",
            width: "100%",
            left: 0,
            top: this.state.wikipediaOpen ? 65 : "57%",
            transition: "all 300ms 0s ease",
            boxShadow: "0px 10px 10px 10px grey"
          }}>
            {wikipedia}
          </div>
          <FloatingActionButton
              onClick={() => {
                this.toggleWikipedia()
              }}
              style={{right: 20, bottom: 20, position: "fixed", zIndex: 10}}>
            {arrow}
          </FloatingActionButton>
          <SettingDrawer
              open={this.state.drawerOpen}/>
          <Dialog
              title="Wikipediaデータをダウンロード中"
              open={this.state.dialogOpen}>
            <LinearProgress
                mode="determinate"
                max={210}
                value={this.state.dataDlProgress}/>
          </Dialog>
        </div>
    )
  }
}


window.onload = () => {
  ReactDOM.render(<Root/>, document.getElementById("container"))
}
