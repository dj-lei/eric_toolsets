import { Component } from './element'
import { Dialog } from './dialog'

class Table extends Component
{
    constructor(position){
        super(position)
        this.table = ''
        this.slider = ''
        this.count = 0
        this.container.style.display = 'inline-block'
        this.table = this.createElementTable()
        this.slider = this.createElementRangeInput(this.count)
    }

    deleteTableAllChilds(){
        while (this.table.firstChild) {
            this.table.removeChild(this.table.lastChild)
        }
    }
}

class TextFileOriginalComponentTable extends Table
{
    constructor(textFileOriginalView){
        super(textFileOriginalView.container)
        this.textFileOriginalView = textFileOriginalView

        let that = this
        this.slider.addEventListener('input', (event) => {
            that.textFileOriginalView.controlScroll(parseInt(event.target.value))
        })

        this.table.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) -1
                that.textFileOriginalView.controlScroll(-1)
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
                that.textFileOriginalView.controlScroll(1)
            }
            
            e.preventDefault()
            e.stopPropagation()
        })

        this.container.append(this.table)
        this.container.append(this.slider)
    }

    refresh(model){
        this.deleteTableAllChilds()
        this.slider.max = model.count
        model.displayLines.forEach((line) => {
            var tr = document.createElement('tr')
            tr.insertAdjacentHTML('beforeend', line)
            this.table.appendChild(tr)
        })
        // if (that.lines.length < that.range) {
        //     for(var i=0; i < that.range - that.lines.length; i++){
        //         var tr = document.createElement('tr')
        //         var td1 = document.createElement('td')
        //         td1.setAttribute('style', 'color:#FFF;background-color:#666666;font-size:10px;')
        //         var td2 = document.createElement('td')
        //         td2.setAttribute('style', 'color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left')
        //         td1.innerHTML = 'END'
        //         td2.innerHTML = 'END'
        //         tr.appendChild(td1)
        //         tr.appendChild(td2)
        //         that.table.appendChild(tr)
        //     }
        // }
    }
}

class SearchAtomComponentTable extends Table
{
    constructor(searchAtomView){
        super(searchAtomView.container)
        this.searchAtomView = searchAtomView

        let that = this
        this.container.style.display = "none"
        this.table.style.display = "none"
        this.slider.style.display = "none"
        this.slider.style.height = `${18 * 15}px`

        this.searchAtomView.del.addEventListener("click", function() {
            that.searchAtomView.onDelete()
        })

        this.searchAtomView.edit.addEventListener("click", function() {
            that.searchAtomView.onDisplayDialog()
        })

        this.searchAtomView.collapsible.innerHTML = '+ ' + this.searchAtomView.model.desc + ` (unknow hits)`
        this.searchAtomView.collapsible.addEventListener("click", function() {
            if (that.table.style.display === "inline-block") {
                that.container.style.display = "none"
                that.table.style.display = "none"
                that.slider.style.display = "none"
            } else {
                that.container.style.display = "block"
                that.table.style.display = "inline-block"
                that.slider.style.display = "inline-block"
            }
        })

        this.slider.addEventListener('input', (event) => {
            that.searchAtomView.controlScroll(parseInt(event.target.value))
        })

        this.table.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) - 1
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
            }
            that.searchAtomView.controlScroll(parseInt(that.slider.value))
            e.preventDefault()
            e.stopPropagation()
        })

        this.container.append(this.table)
        this.container.append(this.slider)
    }

    refresh(model){
        this.deleteTableAllChilds()
        this.slider.max = model.count
        this.searchAtomView.collapsible.innerHTML = '+ ' + model.desc + ` (${model.count} hits)`
        model.displayLines.forEach((line) => {
            var tr = document.createElement('tr')
            tr.insertAdjacentHTML('beforeend', line)
            this.table.appendChild(tr)
        })
        // if (that.lines.length < that.range) {
        //     for(var i=0; i < that.range - that.lines.length; i++){
        //         var tr = document.createElement('tr')
        //         var td1 = document.createElement('td')
        //         td1.setAttribute('style', 'color:#FFF;background-color:#666666;font-size:10px;')
        //         var td2 = document.createElement('td')
        //         td2.setAttribute('style', 'color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left')
        //         td1.innerHTML = 'END'
        //         td2.innerHTML = 'END'
        //         tr.appendChild(td1)
        //         tr.appendChild(td2)
        //         that.table.appendChild(tr)
        //     }
        // }
    }
}

class InsightAtomComponentTable extends Table
{
    constructor(insightAtomView){
        super(insightAtomView.container)
        this.insightAtomView = insightAtomView

        let that = this
        this.container.style.display = "none"
        this.table.style.display = "none"
        this.slider.style.display = "none"
        this.slider.style.height = `${18 * 15}px`

        this.insightAtomView.del.addEventListener("click", function() {
            that.insightAtomView.onDelete()
        })

        this.insightAtomView.edit.addEventListener("click", function() {
            that.insightAtomView.onDisplayDialog()
        })

        this.insightAtomView.collapsible.innerHTML = '+ ' + this.insightAtomView.model.desc
        this.insightAtomView.collapsible.addEventListener("click", function() {
            if (that.table.style.display === "inline-block") {
                that.container.style.display = "none"
                that.table.style.display = "none"
                that.slider.style.display = "none"
            } else {
                that.container.style.display = "block"
                that.table.style.display = "inline-block"
                that.slider.style.display = "inline-block"
            }
        })

        this.slider.addEventListener('input', (event) => {
            that.insightAtomView.controlScroll(parseInt(event.target.value))
        })

        this.table.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) - 1
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
            }
            that.insightAtomView.controlScroll(parseInt(that.slider.value))
            e.preventDefault()
            e.stopPropagation()
        })

        this.container.append(this.table)
        this.container.append(this.slider)
    }

    refresh(model){
        this.deleteTableAllChilds()
        this.slider.max = model.count
        this.insightAtomView.collapsible.innerHTML = '+ ' + model.desc + ` (${model.count} hits)`
        model.displayLines.forEach((line) => {
            var tr = document.createElement('tr')
            tr.insertAdjacentHTML('beforeend', line)
            this.table.appendChild(tr)
        })
    }
}

class BatchInsightComponentTableDialog extends Dialog
{
    constructor(batchInsightView){
        super(batchInsightView.container)
        this.container.style.zIndex = 2
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`

        this.batchInsightComponentTable = new BatchInsightComponentTable(this.subContainer)
    }
}

class BatchInsightComponentTable extends Table
{
    constructor(container){
        super(container)

        this.container.append(this.table)
    }

    refreshUniversal(displayLines){
        this.deleteTableAllChilds()
        displayLines.forEach((line) => {
            var tr = document.createElement('tr')
            var td = document.createElement('td')
            td.innerHTML = line
            tr.appendChild(td)
            this.table.appendChild(tr)
        })
    }

    refreshSingleInsight(model){
        this.deleteTableAllChilds()
        Object.keys(model).forEach((insightAtom) => {
            model[insightAtom].forEach((outlier) => {
                var tr = document.createElement('tr')
                var insightAtomAlias = document.createElement('td')
                insightAtomAlias.innerHTML = insightAtom
                tr.appendChild(insightAtomAlias)

                var timestamp = document.createElement('td')
                timestamp.innerHTML = outlier.timestamp
                var type = document.createElement('td')
                type.innerHTML = outlier.type
                var desc = document.createElement('td')
                desc.innerHTML = outlier.desc

                tr.appendChild(timestamp)
                tr.appendChild(type)
                tr.appendChild(desc)
                this.table.appendChild(tr)
            })
        })
    }

    refresh(sample){
        var tr = document.createElement('tr')
        Object.keys(sample).forEach((key) => {
            var column = document.createElement('td')
            column.innerHTML = sample[key]
            tr.appendChild(column)
        })
        this.table.appendChild(tr)
    }
}

class BatchStatisticComponentTableDialog extends Dialog
{
    constructor(batchStatisticView){
        super(batchStatisticView.container)
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`

        this.batchStatisticComponentTable = new BatchStatisticComponentTable(this.subContainer)
    }
}

class BatchStatisticComponentTable extends Table
{
    constructor(container){
        super(container)

        this.container.append(this.table)
    }

    refresh(sample){
        var tr = document.createElement('tr')
        Object.keys(sample).forEach((key) => {
            var column = document.createElement('td')
            column.innerHTML = sample[key]
            tr.appendChild(column)

            // model.result[file].forEach((statisticAtom) => {
            //     var alias = document.createElement('td')
            //     alias.innerHTML = statisticAtom.alias
            //     var resultType = document.createElement('td')
            //     resultType.innerHTML = statisticAtom.resultType
            //     var result = document.createElement('td')
            //     result.innerHTML = statisticAtom.result

            //     tr.appendChild(alias)
            //     tr.appendChild(resultType)
            //     tr.appendChild(result)
            // })
        })
        this.table.appendChild(tr)
    }
}

export {TextFileOriginalComponentTable, SearchAtomComponentTable, InsightAtomComponentTable, BatchInsightComponentTableDialog, BatchStatisticComponentTableDialog}