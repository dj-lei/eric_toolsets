import { Component } from './element'

class Textarea extends Component
{
    constructor(position){
        super(position)
        this.container.style.display = 'inline-block'
        this.textarea = this.createElementTextarea()
    }
}

class StatisticAtomComponentTextarea extends Textarea
{
    constructor(statisticAtomView){
        super(statisticAtomView.container)
        this.statisticAtomView = statisticAtomView
        this.collapsible = ''

        let that = this
        var del = this.createElementButton('X')
        del.style.backgroundColor = 'red'
        del.style.width = '2%'
        del.addEventListener("click", function() {
            that.insightAtomView.onDelete()
        })

        var search = this.createElementButton('O')
        search.style.backgroundColor = 'green'
        search.style.width = '2%'
        search.addEventListener("click", function() {
            that.statisticAtomView.statisticAtomComponentDialog.display()
        })

        this.collapsible = this.createElementButton('')
        this.collapsible.style.backgroundColor = '#777'
        this.collapsible.style.width = '94%'
        this.collapsible.style.textAlign = 'left'
        this.collapsible.addEventListener("click", function() {
            if (that.textarea.style.display === "inline-block") {
                that.textarea.style.display = "none"
            } else {
                that.textarea.style.display = "inline-block"
            }
        })

        this.container.append(del)
        this.container.append(search)
        this.container.append(this.collapsible)
        this.container.append(this.textarea)
    }

    refresh(model){
        this.collapsible.innerHTML = '+ ' + model.desc
        this.textarea.value = model.result
    }
}

export {StatisticAtomComponentTextarea}