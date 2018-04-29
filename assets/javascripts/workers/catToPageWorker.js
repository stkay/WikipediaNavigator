import { fetch } from "./fetchJSON"

let catToPage

/*
  受け取るオブジェクト
    {
      cmd: 'init' | 'getPages',
      arg: String
    }

  返すオブジェクト
    {
      cmd: 同上,
      res: 'success' | Object
    }
*/

module.exports = function(self){
  self.addEventListener('message', async (e) => {
    const cmd = e.data.cmd
    switch(cmd){
      case 'init':
        console.log("start fetch catToPage")
        await init()
        console.log("done fetch catToPage")
        self.postMessage({ cmd: cmd, res: 'success' })
        break
      case 'memberByMember':
        self.postMessage({ cmd: cmd, res: memberByMember(e.data.arg) })
        break
      default:
        self.postMessage({ cmd: cmd, res: "command not found" })
        break
    }
  })
}

const init = async () => {
  catToPage = await fetch("keycat.json")
  return
}

const memberByMember = categories => categories.map(cat => ({category: cat, entries: catToPage[cat]}))
