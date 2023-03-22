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
        tablink.style.position = 'relative'
        tablink.style.display = 'inline-block'

        var title = this.createElementButton('')
        title.style.width = '100%'
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
        tablink.style.width = `${model.file_name.length * 8}px`
        var title = this.tabs[model.namespace].title
        title.innerHTML = model.file_name
        title.addEventListener('click', function()
        {
            that.fileContainerView.controlDisplayFile(model.namespace)
        })

        var close = this.createElementButton('X')
        close.style.position = 'absolute'
        close.style.right = 0
        close.style.backgroundColor = 'red'
        close.style.border = 0
        close.style.outline = 0
        close.addEventListener("click", function() {
            that.fileContainerView.controlDeleteFile(model.namespace)
        })
        tablink.append(close)
        this.tabs[model.namespace]['close'] = close

        this.resetWidth()
    }

    resetWidth(){
        var totalLength = 0
        Object.keys(this.tabs).forEach(namespace => {
            totalLength += parseInt(this.tabs[namespace].ins.style.width.replace('px', ''))
        })

        var width = 0
        if (totalLength > this.container.clientWidth) {
            width = Math.round( this.container.clientWidth / Object.keys(this.tabs).length )
            Object.keys(this.tabs).forEach(namespace => {
                this.tabs[namespace].ins.style.width = `${width - 2}px`
            })
        }
    }

    displayFile(params)
    {
        if((params.earlier_active_text_file != '') & (params.earlier_active_text_file in this.tabs)){
            this.tabs[params.earlier_active_text_file].title.style.backgroundColor = "#555"
        }
        this.tabs[params.active_text_file].title.style.backgroundColor = "#333"
    }
}

class TextFileFunctionComponentTab extends Tab
{
    constructor(textFileFunctionView, container){
        super(container)
        this.textFileFunctionView = textFileFunctionView

        // this.container.style.position = 'fixed'
        // this.container.style.zIndex = 1
        this.container.style.left = 0
        // this.container.style.top = 0
        this.container.style.width = '100%'
        this.container.style.overflow = 'hidden'
        this.container.style.border = 'none'

        let that = this
        this.subscribePlaceholder('Search')
        var tablink = this.getPlaceholder('Search')
        tablink.style.width = '33%'
        this.searchTitle = this.tabs['Search'].title
        this.searchTitle.style.width = '100%'
        this.searchTitle.innerHTML = 'Search'
        this.searchTitle.addEventListener('click', function()
        {
            that.textFileFunctionView.controlSelectFunction('search')
        })

        this.subscribePlaceholder('Chart')
        tablink = this.getPlaceholder('Chart')
        tablink.style.width = '32%'

        this.chartTitle = this.tabs['Chart'].title
        this.chartTitle.style.width = '100%'
        this.chartTitle.innerHTML = 'Chart'
        this.chartTitle.addEventListener('click', function()
        {
            that.textFileFunctionView.controlSelectFunction('chart')
        })

        this.subscribePlaceholder('Insight')
        tablink = this.getPlaceholder('Insight')
        tablink.style.width = '0%'
        this.insightTitle = this.tabs['Insight'].title
        this.insightTitle.style.width = '100%'
        this.insightTitle.innerHTML = 'Insight'
        this.insightTitle.addEventListener('click', function()
        {
            that.textFileFunctionView.controlSelectFunction('insight')
        })

        this.subscribePlaceholder('Statistic')
        tablink = this.getPlaceholder('Statistic')
        tablink.style.width = '33%'
        this.statisticTitle = this.tabs['Statistic'].title
        this.statisticTitle.style.width = '100%'
        this.statisticTitle.innerHTML = 'Statistic'
        this.statisticTitle.addEventListener('click', function()
        {
            that.textFileFunctionView.controlSelectFunction('statistic')
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
            that.textFileFunctionView.controlHidden()
        })
    }

    displayFunction(func)
    {
        if(func == 'search'){
            this.searchTitle.style.backgroundColor = '#333'
            this.insightTitle.style.backgroundColor = '#555'
            this.chartTitle.style.backgroundColor = '#555'
            this.statisticTitle.style.backgroundColor = '#555'
        }else if(func == 'insight'){
            this.searchTitle.style.backgroundColor = '#555'
            this.insightTitle.style.backgroundColor = '#333'
            this.chartTitle.style.backgroundColor = '#555'
            this.statisticTitle.style.backgroundColor = '#555'
        }else if(func == 'chart'){
            this.searchTitle.style.backgroundColor = '#555'
            this.insightTitle.style.backgroundColor = '#555'
            this.chartTitle.style.backgroundColor = '#333'
            this.statisticTitle.style.backgroundColor = '#555'
        }else if(func == 'statistic'){
            this.searchTitle.style.backgroundColor = '#555'
            this.insightTitle.style.backgroundColor = '#555'
            this.chartTitle.style.backgroundColor = '#555'
            this.statisticTitle.style.backgroundColor = '#333'
        }
    }
}

export {FileContainerComponentTab, TextFileFunctionComponentTab}