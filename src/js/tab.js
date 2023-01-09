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

    updatePlaceholder(model){
        let that = this
        var tablink = this.tabs[model.namespace].ins
        tablink.style.width = `${model.fileName.length * 10}px`
        var title = this.tabs[model.namespace].title
        title.innerHTML = model.fileName
        title.addEventListener('click', function()
        {
            that.displayFile(model)
        })

        var close = this.createElementButton('X')
        close.style.backgroundColor = 'red'
        close.addEventListener("click", function() {
            that.deleteTablink(model)
        })
        tablink.append(close)
        this.tabs[model.namespace]['close'] = close
    }

    displayFile(model)
    {
        this.tabs[this.fileContainerView.model.activeTextFileModel].title.style.backgroundColor = "#555"
        this.tabs[model.namespace].title.style.backgroundColor = "#333"
        this.fileContainerView.displayFile(model.namespace)
    }

    deleteFile(model){

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
            that.searchTitle.style.backgroundColor = '#333'
            that.chartTitle.style.backgroundColor = '#555'
            that.statisticTitle.style.backgroundColor = '#555'
            that.textFileFunctionView.onSelectFunction('search')
        })

        this.subscribePlaceholder('Chart')
        tablink = this.getPlaceholder('Chart')
        tablink.style.width = '33%'

        this.chartTitle = this.tabs['Chart'].title
        this.chartTitle.style.width = '100%'
        this.chartTitle.innerHTML = 'Chart'
        this.chartTitle.addEventListener('click', function()
        {
            that.searchTitle.style.backgroundColor = '#555'
            that.chartTitle.style.backgroundColor = '#333'
            that.statisticTitle.style.backgroundColor = '#555'
            that.textFileFunctionView.onSelectFunction('chart')
        })

        this.subscribePlaceholder('Statistic')
        tablink = this.getPlaceholder('Statistic')
        tablink.style.width = '32%'
        this.statisticTitle = this.tabs['Statistic'].title
        this.statisticTitle.style.width = '100%'
        this.statisticTitle.innerHTML = 'Statistic'
        this.statisticTitle.addEventListener('click', function()
        {
            that.searchTitle.style.backgroundColor = '#555'
            that.chartTitle.style.backgroundColor = '#555'
            that.statisticTitle.style.backgroundColor = '#333'
            that.textFileFunctionView.onSelectFunction('statistic')
        })

        this.subscribePlaceholder('Hidden')
        tablink = this.getPlaceholder('Hidden')
        tablink.style.width = '2%'
        var hidden = this.tabs['Hidden'].title
        hidden.style.color = '#FFF'
        hidden.style.backgroundColor = '#FF9900'
        hidden.style.width = '2%'
        hidden.fontSize = '30px'
        hidden.innerHTML = '-'
        hidden.addEventListener("click", function() {
            that.textFileFunctionView.viewHidden()
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