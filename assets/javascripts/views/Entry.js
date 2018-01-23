import React, { Component } from "react"
import Request from "superagent"

const ENTRY_HEIGHT = 70

export default class Entry extends Component {
  constructor(props){
    super(props)
    this.state = {
      img: "./images/noimg.png"
    }
    this.style = {
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
      width: "100%",
      height: ENTRY_HEIGHT,
      marginBottom: 30,
      borderRadius: "20px"
    }
    if(this.props.isFocus){
      this.style.background = "#AAA"
    }else{
      this.style.background = "#EEE"
    }

    this.searchImage()
  }

  componentWillReceiveProps(nextProps){
    console.log(nextProps)
    if(this.props.title == nextProps.title){
      return
    }
    this.setState({img: "./images/noimg.png"})
    this.searchImage(nextProps.title)
  }

  searchImage(title = this.props.title) {
    console.log("search image")

    // Request
    //   .get(`getimage/${title}`)
    //   .then(res => {
    //     this.setState({ img: res.text })
    //   })
  }

  render() {
    console.log("render")

    if(this.props.empty){
      return(
        <div
          className={"emptyentry"}
          style={this.style}></div>
      )
    }

    return(
      <div style={this.style}>
        <img
          src={this.state.img}
          style={{
            width: ENTRY_HEIGHT,
            height: ENTRY_HEIGHT,
            objectFit: "cover",
            marginRight: "10px",
            borderRadius: "20px"
          }} />
        <span style={{verticalAlign: "middle" }}>
          {this.props.title}
        </span>
      </div>
    )
  }
}
