import { FileViewer } from './TextLogic'

class Flow
{
    constructor(){
        this.canvas = ''
        this.init()
    }

    init(){
        this.canvas = document.createElement('div')
        this.canvas.style.display = "block"
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.style.border = '1px solid #888'
        this.canvas.style.backgroundColor = '#555'
    }

}

class TextLogicFlow extends Flow
{
    constructor(files, themes, position){
        super()
        this.register(position)
        this.files = files
        this.themes = themes
        this.containerFiles = {}
        this.tablinks = document.createElement('div') // temporary container
        this.tabcontents = document.createElement('div') // temporary container
        this.workFlow()
    }

    register(position){
        position.append(this.canvas)
    }

    workFlow(){
        let that = this
        var width = parseInt(this.canvas.clientWidth / 3)
        var height = parseInt(this.canvas.clientHeight / 3) 
        this.files.forEach(file => {
            var row = document.createElement('div')
            row.style.width = '100%'
            row.style.display = 'inline-block'
            row.style.overflowX = 'scroll'
            row.style.overflowY = 'hidden'
            row.style.height = `${height}px`
            row.style.whiteSpace = 'nowrap'

            this.canvas.append(row)
            var f = new FileViewer(this, file)
            f.openFile(function() {
                f.chartArea = row
                f.loadConfig(that.themes)
                console.log(row)
            })
        })
    }
}

export {TextLogicFlow}