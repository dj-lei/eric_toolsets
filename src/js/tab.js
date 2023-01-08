import { Component } from './element'

class Tab extends Component
{
    constructor(position){
        super(position)
        this.container.style.display = 'inline-block'
        this.tabs = {}
    }

    subscribePlaceholder(namespace){
        var tablink = this.createElementDiv()
        tablink.setAttribute("name", namespace)
        tablink.style.display = 'inline-block'

        var title = this.createElementButton('')
        tablink.append(title)
        this.container.append(tablink)
        this.tabs[namespace] = {'ins':tablink, 'title':title}
    }

    getPlaceholder(namespace){
        return this.tabs[namespace].ins
    }
}

class FileContainerComponentTab extends Tab
{
    constructor(fileContainerView){
        super(fileContainerView.container)
        this.fileContainerView = fileContainerView
    }

    updatePlaceholder(textFileModel){
        let that = this
        var tablink = this.tabs[textFileModel.namespace].ins
        tablink.style.width = `${textFileModel.fileName.length * 10}px`
        var title = this.tabs[textFileModel.namespace].title
        title.innerHTML = textFileModel.fileName
        title.addEventListener('click', function()
        {
            that.displayFile(textFileModel)
        })

        var close = this.createElementButton('X')
        close.style.backgroundColor = 'red'
        close.addEventListener("click", function() {
            that.deleteTablink(textFileModel)
        })
        tablink.append(close)
        this.tabs[textFileModel.namespace]['close'] = close
    }

    displayFile(textFileModel)
    {
        this.tabs[this.fileContainerView.model.activeTextFileModel].title.style.backgroundColor = "#555"
        this.tabs[textFileModel.namespace].title.style.backgroundColor = "#333"
        this.fileContainerView.displayFile(textFileModel.namespace)
    }

    deleteFile(textFileModel){

    }
}

class TextFileFunctionComponentTab extends Tab
{
    constructor(textFileFunctionView){
        super(textFileFunctionView.container)
        this.textFileFunctionView = textFileFunctionView

        let that = this
        this.subscribePlaceholder('Search')
        var tablink = this.getPlaceholder('Search')
        tablink.style.width = '33%'
        this.searchTitle = this.tabs['Search'].title
        this.searchTitle.style.width = '100%'
        this.searchTitle.innerHTML = 'Search'
        this.searchTitle.addEventListener('click', function()
        {
            // that.textFileFunctionView.functionSearchView
        })

        this.subscribePlaceholder('Chart')
        tablink = this.getPlaceholder('Chart')
        tablink.style.width = '33%'

        this.chartTitle = this.tabs['Chart'].title
        this.chartTitle.style.width = '100%'
        this.chartTitle.innerHTML = 'Chart'
        this.chartTitle.addEventListener('click', function()
        {
            // that.textFileFunctionView.functionSearchView
        })

        this.subscribePlaceholder('Statistics')
        tablink = this.getPlaceholder('Statistics')
        tablink.style.width = '33%'
        this.statisticsTitle = this.tabs['Statistics'].title
        this.statisticsTitle.style.width = '100%'
        this.statisticsTitle.innerHTML = 'Statistics'
        this.statisticsTitle.addEventListener('click', function()
        {
            // that.textFileFunctionView.functionSearchView
        })


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