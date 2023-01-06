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

    createNewTablink(textFileView){
        let that = this
        var tablink = this.tabs[textFileView.namespace].ins
        tablink.style.width = `${textFileView.model.fileName.length * 10}px`
        var title = this.tabs[textFileView.namespace].title
        title.innerHTML = textFileView.model.fileName
        title.addEventListener('click', function()
        {
            that.openTablink(textFileView)
        })

        var close = this.createElementButton('X')
        close.style.backgroundColor = 'red'
        close.addEventListener("click", function() {
            that.deleteTablink(textFileView)
        })
        tablink.append(close)
        this.tabs[textFileView.namespace]['close'] = close
    }

    openTablink(textFileView)
    {
        this.tabs[this.fileContainerView.activeTextFileView].title.style.backgroundColor = "#555"
        this.fileContainerView.textFileViews[this.fileContainerView.activeTextFileView].textFileOriginalView.textFileOriginalComponentTable.hidden()
        
        this.tabs[textFileView.namespace].title.style.backgroundColor = "#333"
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
        this.container.style.display = 'none'

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