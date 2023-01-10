import { Component } from './element'

class Custom extends Component
{
    constructor(position){
        super(position)
    }
}

class StatisticAtomComponentCustom extends Custom
{
    constructor(statisticAtomView){
        super(statisticAtomView.container)
        this.exp = ''
        this.result = ''
        this.init()
    }

    init(){
        this.exp = document.createElement('p')
        this.exp.style.color = "white"
        this.result = document.createElement('p')
        this.result.style.color = "white"
        this.container.append(this.exp)
        this.container.append(this.result)
    }

    refresh(model){
        this.exp.innerHTML = model.exp
        this.result.innerHTML = model.result
    }
}


export {StatisticAtomComponentCustom}