import { FileViewer } from './TextLogic'
import common from '@/plugins/common'

class Flow
{
    constructor(){
        this.canvas = ''
        this.displayView = ''
        this.init()
    }

    init(){
        this.canvas = document.createElement('div')
        this.canvas.style.display = "block"
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.style.border = '1px solid #888'
        this.canvas.style.backgroundColor = '#555'

        this.displayView = document.createElement('div')
        this.displayView.style.overflow = 'auto'
        this.displayView.style.width = '100%'
        this.displayView.style.height = '100%'

        this.bottomNav = document.createElement('div')
        this.bottomNav.style.position = 'fixed'
        this.bottomNav.style.bottom = 0
        this.bottomNav.style.width = '100%'

        this.canvas.append(this.displayView)
        this.canvas.append(this.bottomNav)
    }

    addButton(name, func, color){
        let that = this
        var button = document.createElement('button')
        button.style.backgroundColor = color
        button.style.color = '#FFF'
        button.style.float = 'right'
        button.style.display = 'block'
        button.style.padding = '14px 16px'
        button.innerHTML = name
        button.addEventListener('click', function()
        {
            func(that)
        })
        this.bottomNav.appendChild(button)
        return button
    }

    open(){
        this.canvas.style.display = "block"
    }


    close(that){
        if(that){
            that.canvas.style.display = "none"
        }else{
            this.canvas.style.display = "none"
        }
      }

    delete(){
        common.removeAll(this.canvas)
    }

}

class TextLogicFlow extends Flow
{
    constructor(parent, files, themes, position){
        super()
        this.register(position)
        this.parent = parent
        this.files = files
        this.themes = themes
        this.containerFiles = {}
        this.tablinks = document.createElement('div') // temporary container
        this.tabcontents = document.createElement('div') // temporary container

        
        this.height = parseInt(document.body.offsetHeight / 5)
        this.width = this.height * 3

        this.cancelBtn = this.addButton('CANCEL', this.close, 'red')
        this.editBtn = this.addButton('EDIT', this.openWorkFlowDialog, 'green')
        this.workFlow()
    }

    register(position){
        position.append(this.canvas)
    }

    workFlow(){
        this.work(0, this.files[0], this.files)
    }

    work(count, file, files){
        let that = this
        var row = document.createElement('div')
        row.style.width = '100%'
        row.style.display = 'inline-block'
        row.style.overflowX = 'scroll'
        row.style.overflowY = 'hidden'
        row.style.whiteSpace = 'nowrap'
        row.style.height = `${this.height}px`
        var name = document.createElement("div")
        name.style.height = `${this.height}px`
        name.style.display = 'inline-block'
        // name.style.zIndex = 1
        name.style.writingMode = 'tb-rl'
        name.style.backgroundColor = '#333'
        name.style.textAlign = 'center'
        name.style.color = 'white'
        name.style.padding = '0px 5px 0px 5px'
        name.style.border = '1px solid #FFF'
        name.innerHTML = file.split('\\')[file.split('\\').length - 1]

        row.appendChild(name)
        var f = new FileViewer(this, file)
        f.openFile(function() {
            f.chartArea = row
            f.loadConfig(that.themes, function() {
                f.close()
                name.style.height = f.chartArea.style.height
                that.displayView.append(row)
                if (count+2 <= files.length) {
                    that.work(count+1, files[count+1], files)
                }
            })
        })
    }

    openWorkFlowDialog(that){
        that.parent.workFlowDialog.open()
    }
}

export {TextLogicFlow}