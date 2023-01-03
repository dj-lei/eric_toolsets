import { Graph } from './graph'

class List extends Graph
{
    constructor(position){
        super(position)
    }

    createNewItem(){
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
        this.addTablink(tablink)
        return tablink
    }

}

class SearchFunctionComponentList extends List
{
    constructor(searchFunctionView){
        super(searchFunctionView.container)
        this.searchFunctionView = searchFunctionView
    }

    createNewSearchItem(textFileView){
        let that = this

        

    }
}


export {SearchFunctionComponentList}