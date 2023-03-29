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

        let that = this
        this.container.style.display = 'none'

        this.statisticAtomView.collapsible.innerHTML = '+ ' + this.statisticAtomView.model.desc
        this.statisticAtomView.collapsible.addEventListener("click", function() {
            if (that.container.style.display === "inline-block") {
                that.container.style.display = "none"
            } else {
                that.container.style.display = "inline-block"
            }
        })

        this.container.append(this.textarea)
    }

    refresh(model){
        this.statisticAtomView.collapsible.innerHTML = '+ ' + model.desc
        this.textarea.value = model.result
    }
}

export {StatisticAtomComponentTextarea}