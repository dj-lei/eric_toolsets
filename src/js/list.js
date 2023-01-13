import { Component } from './element'

class List extends Component
{
    constructor(position){
        super(position)
        this.ul = this.createElementUl()
        this.ul.style.listStyleType = 'none'
        this.ul.style.padding = 0
        this.ul.style.margin = 0
        this.container.append(this.ul)
    }

    subscribePlaceholder(namespace){
        var li = this.createElementLi()
        li.id = namespace
        this.ul.append(li)
    }

    // getPlaceholder(namespace){
    //     return this.locateChildElement(this.ul, 'li', namespace)
    // }
}

class SearchFunctionComponentList extends List
{
    constructor(searchFunctionView){
        super(searchFunctionView.container)
    }
}

class ChartFunctionComponentList extends List
{
    constructor(chartFunctionView){
        super(chartFunctionView.container)
    }
}

class StatisticFunctionComponentList extends List
{
    constructor(chartFunctionView){
        super(chartFunctionView.container)
    }
}


export {SearchFunctionComponentList, ChartFunctionComponentList, StatisticFunctionComponentList}