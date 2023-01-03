import { Graph } from './graph'

class Tab extends Graph
{
    constructor(position){
        super(position)
        this.container.style.display = 'inline-block'
    }

    createNewTablink(){
        var tablink = document.createElement('div')
        tablink.style.display = 'inline-block'

        var title = document.createElement('button')
        title.name = 'title'
        title.style.backgroundColor = '#555'
        title.style.color = 'white'
        title.style.border = 'none'
        title.style.cursor = 'pointer'
        title.style.padding = '5px 8px'
        title.style.fontSize = '12px'

        tablink.append(title)
        this.container.append(tablink)
        return tablink
    }

}

class FileContainerComponentTab extends Tab
{
    constructor(fileContainerView){
        super(fileContainerView.container)
        this.fileContainerView = fileContainerView
    }

    placeholder(namespace){
        var tablink = super.createNewTablink()
        tablink.setAttribute("name", namespace)
    }

    createNewTablink(textFileView){
        let that = this
        var tablink = this.container.querySelector(`div[name="${textFileView.namespace}"]`)
        var title = tablink.querySelector('button[name="title"]')
        title.style.width = `${textFileView.model.fileName.length * 7}px`
        title.innerHTML = textFileView.model.fileName
        title.addEventListener('click', function()
        {
            that.openTablink(textFileView)
        })

        var close = document.createElement('button')
        close.name = 'close'
        close.style.backgroundColor = 'red'
        close.style.color = 'white'
        close.style.cursor = 'pointer'
        close.style.padding = '5px 8px'
        close.style.fontSize = '12px'
        close.innerHTML = 'X'
        close.addEventListener("click", function() {
            that.deleteTablink(textFileView)
        })
        tablink.append(close)
    }

    openTablink(textFileView)
    {
        this.container.querySelector(`div[name="${this.fileContainerView.activeTextFileView}"]`).querySelector(`button[name="title"]`).style.backgroundColor = "#555"
        this.fileContainerView.textFileViews[this.fileContainerView.activeTextFileView].textFileOriginalView.textFileOriginalComponentTable.hidden()
        
        this.container.querySelector(`div[name="${textFileView.namespace}"]`).querySelector(`button[name="title"]`).style.backgroundColor = "#333"
        textFileView.textFileOriginalView.textFileOriginalComponentTable.display('inline-block')

        this.fileContainerView.activeTextFileView = textFileView.namespace
    }

    deleteTablink(textFileView){

    }
}

class TextFileFunctionComponentTab extends Tab
{
    constructor(textFileFunctionView){
        super(textFileFunctionView.container)
        this.textFileFunctionView = textFileFunctionView

        let that = this
        this.searchTablink = this.createNewTablink()
        this.searchTablink.style.width = '33%'
        this.searchTablink.innerHTML = 'Search'
        this.searchTablink.addEventListener('click', function()
        {
            // that.textFileFunctionView.functionSearchView
        })

        this.keyValueTreeTablink = this.createNewTablink()
        this.keyValueTreeTablink.style.width = '33%'
        this.keyValueTreeTablink.innerHTML = 'KeyValueTree'

        this.chartTablink = this.createNewTablink()
        this.chartTablink.style.width = '33%'
        this.chartTablink.innerHTML = 'Chart'
    }

    openTablink(tablink)
    {
        // if(tablink == 'Search'){

        // }else if(tablink == 'KeyValueTree'){

        // }else if(tablink == 'Chart'){

        // }
    }
}

export {FileContainerComponentTab, TextFileFunctionComponentTab}