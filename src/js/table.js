import { Component } from './element'
import { Dialog } from './dialog'
import { InsightAtomComponentSequentialChart } from './chart'

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
        this.slider.value = model.point
        model.display_lines.forEach((line) => {
            var tr = this.createElementTr()
            tr.insertAdjacentHTML('beforeend', line)
            this.table.appendChild(tr)
        })
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

        this.searchAtomView.collapsible.innerHTML = '+ ' + this.searchAtomView.model.desc + ` (unknow hits)`
        this.searchAtomView.collapsible.addEventListener("click", function() {
            if (that.table.style.display === "none") {
                that.searchAtomView.controlActive()
            }
        })

        this.slider.addEventListener('input', (event) => {
            that.searchAtomView.controlScroll(parseInt(event.target.value))
        })

        this.table.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) -1
                that.searchAtomView.controlScroll(-1)
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
                that.searchAtomView.controlScroll(1)
            }
            that.searchAtomView.controlScroll(parseInt(that.slider.value))
            e.preventDefault()
            e.stopPropagation()
        })

        this.container.append(this.table)
        this.container.append(this.slider)
    }

    hidden(){
        this.container.style.display = "none"
        this.table.style.display = "none"
        this.slider.style.display = "none"
    }

    display(){
        this.container.style.display = "block"
        this.table.style.display = "inline-block"
        this.slider.style.display = "inline-block"
    }

    refresh(model){
        let that = this
        this.deleteTableAllChilds()
        this.slider.max = model.count
        this.slider.value = model.point
        this.searchAtomView.collapsible.innerHTML = '+ ' + model.desc + ` (${model.count} hits)`
        model.display_lines.forEach((line) => {
            var tr = this.createElementTr()
            tr.insertAdjacentHTML('beforeend', line['text'])

            tr.addEventListener("dblclick", function() {
                that.searchAtomView.controlTextClickEvent({'globalIndex': line['global_index']})
            })
            this.table.appendChild(tr)
        })
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
        this.table.style.overflowY = "auto"
        this.table.style.height = `400px`

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

        this.container.append(this.table)
    }

    refresh(model){
        let that = this
        this.deleteTableAllChilds()
        this.slider.max = model.count
        this.insightAtomView.collapsible.innerHTML = '+ ' + model.desc + ` (${model.count} hits)`
        model.display_lines.forEach((line, index) => {
            var tr = this.createElementTr()
            var tdIndex = this.createElementTd()
            tdIndex.innerHTML = index

            var tdAbnormalType = this.createElementTd()
            tdAbnormalType.innerHTML = line['abnormal_type']

            var tdTimestamp = this.createElementTd()
            tdTimestamp.innerHTML = line['timestamp']

            var tdDesc = this.createElementTd()
            var tdOrigin = this.createElementTd()
            if (line['type'] == 'mark') {
                tdDesc.innerHTML = line['desc']
                tdOrigin.innerHTML = line['origin']
            }else if(line['type'] == 'str') {
                tdDesc.innerHTML = line['desc']
                tdOrigin.innerHTML = line['origin']
            }else if(line['type'] == 'float') {
                var descChart = new InsightAtomComponentSequentialChart(tdDesc, this.insightAtomView)
                descChart.refresh(line['desc'])
                descChart.chart.resize({height:`200px`, width:`800px`})

                var OriginChart = new InsightAtomComponentSequentialChart(tdOrigin, this.insightAtomView)
                OriginChart.refresh(line['origin'])
                OriginChart.chart.resize({height:`200px`, width:`800px`})
            }

            tr.appendChild(tdIndex)
            tr.appendChild(tdAbnormalType)
            tr.appendChild(tdTimestamp)
            tr.appendChild(tdDesc)
            tr.appendChild(tdOrigin)

            tr.addEventListener("dblclick", function() {
                that.insightAtomView.controlTextClickEvent({'globalIndex': line['global_index']})
            })
            // tr.insertAdjacentHTML('beforeend', line)
            this.table.appendChild(tr)
        })
    }
}

class BatchInsightComponentTableDialog extends Dialog
{
    constructor(batchInsightView){
        super(batchInsightView.container)
        this.container.style.zIndex = 2
        this.subContainer.style.width = '50%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`

        this.batchInsightComponentTable = new BatchInsightComponentTable(this)
    }
}

class BatchInsightComponentTable extends Table
{
    constructor(batchInsightComponentTableDialog){
        super(batchInsightComponentTableDialog.subContainer)
        this.batchInsightComponentTableDialog = batchInsightComponentTableDialog

        this.container.append(this.table)

        let that = this

        this.bottomBtnSets = this.createElementDiv()
        this.bottomBtnSets.style.position = 'fixed'
        this.bottomBtnSets.style.bottom = 0
        this.bottomBtnSets.style.width = '50%'
        this.container.append(this.bottomBtnSets)

        var cancelBtn = this.createElementButton('CANCEL')
        cancelBtn.style.backgroundColor = 'red'
        cancelBtn.style.float = 'right'
        cancelBtn.onclick = function(){that.batchInsightComponentTableDialog.hidden()}
        this.bottomBtnSets.appendChild(cancelBtn)
    }

    refreshUniversal(display_lines){
        this.deleteTableAllChilds()

        var thr = this.createElementTr()
        var th = this.createElementTh()
        th.innerHTML = 'Anomalous Commonality'
        thr.appendChild(th)
        this.table.appendChild(thr)

        display_lines.forEach((line) => {
            var tr = this.createElementTr()
            var td = this.createElementTd()
            td.innerHTML = line
            tr.appendChild(td)
            this.table.appendChild(tr)
        })
    }

    refreshSingleInsight(data){
        this.deleteTableAllChilds()
        data.forEach((outlier) => {
            console.log(outlier)
            var tr = document.createElement('tr')
            var name = document.createElement('td')
            name.innerHTML = outlier.name
            var timestamp = document.createElement('td')
            timestamp.innerHTML = outlier.timestamp
            var abnormalType = document.createElement('td')
            abnormalType.innerHTML = outlier.abnormal_type
            var desc = document.createElement('td')
            desc.innerHTML = outlier.desc

            tr.appendChild(name)
            tr.appendChild(timestamp)
            tr.appendChild(abnormalType)
            tr.appendChild(desc)
            this.table.appendChild(tr)
        })
    }

    refresh(sample){
        var thr = this.createElementTr()
        var th = this.createElementTh()
        th.innerHTML = 'Anomalous Commonality'
        thr.appendChild(th)
        this.table.appendChild(thr)

        var tr = this.createElementTr()
        Object.keys(sample).forEach((key) => {
            var column = this.createElementTd()
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
        this.batchStatisticView = batchStatisticView
        this.subContainer.style.width = '100%' 
        this.subContainer.style.margin = 0
        this.subContainer.style.height = `${document.body.offsetHeight}px`

        let that = this
        var topBtnSets = this.createElementDiv()
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.width = '10%'
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.float = 'right'
        this.cancel.onclick = function(){that.hidden()}
        this.code = this.createElementButton('CODE')
        this.code.style.widht = '10%'
        this.code.style.backgroundColor = 'green'
        this.code.style.float = 'right'
        this.code.onclick = function(){that.batchStatisticComponentCodeDialog.display()}

        topBtnSets.appendChild(this.cancel)
        topBtnSets.appendChild(this.code)
        this.subContainer.appendChild(topBtnSets)

        this.batchStatisticComponentTable = new BatchStatisticComponentTable(this.subContainer)
        this.batchStatisticComponentCodeDialog = new BatchStatisticComponentCodeDialog(this)
    }

    clear(){
        this.batchStatisticComponentTable.clear()
    }

    refresh(sample){
        this.batchStatisticComponentTable.refresh(sample)
    }

    refreshCode(model){
        this.batchStatisticComponentCodeDialog.refresh(model)
    }
}

class BatchStatisticComponentCodeDialog extends Dialog
{
    constructor(batchStatisticComponentTableDialog){
        super(batchStatisticComponentTableDialog.subContainer)
        this.batchStatisticComponentTableDialog = batchStatisticComponentTableDialog

        let that = this
        this.subContainer.appendChild(this.createElementHr())
        //  python code 
        this.code = this.createElementTextarea()
        this.subContainer.appendChild(this.createElementHeader('Python Code'))
        this.subContainer.appendChild(this.code)
        this.subContainer.appendChild(this.createElementHr())

        //  code test result 
        this.result = this.createElementTextarea()
        this.subContainer.appendChild(this.createElementHeader('Code Result'))
        this.subContainer.appendChild(this.result)

        // search and cancel button
        this.apply = this.createElementButton('RUN')
        this.apply.style.width = '50%'
        this.apply.onclick = function(){that.run()}
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.width = '50%'
        this.cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(this.apply)
        this.subContainer.appendChild(this.cancel)
    }

    refresh(model){
        this.result.value = model.result
    }

    run(){
        this.batchStatisticComponentTableDialog.batchStatisticView.controlCode(this.code.value)
    }
}

class BatchStatisticComponentTable extends Table
{
    constructor(container){
        super(container)
        this.isHasTh = false
        this.container.style.overflowY = 'hidden'
        this.table.style.overflowY = 'auto'
        this.table.style.height = `${document.body.offsetHeight - 50}px`
        this.container.append(this.table)
    }

    clear(){
        this.deleteTableAllChilds()
        this.isHasTh = false
    }

    refresh(sample){
        if (!this.isHasTh) {
            var thr = this.createElementTr()
            Object.keys(sample).forEach((key) => {
                if (!['filePath', 'configPath'].includes(key)) {
                    var th = this.createElementTh()
                    th.innerHTML = key
                    thr.appendChild(th)
                }
            })
            this.isHasTh = true
            this.table.appendChild(thr)
        }

        var tr = this.createElementTr()
        Object.keys(sample).forEach((key) => {
            if (!['filePath', 'configPath'].includes(key)) {
                var td = this.createElementTd()
                td.innerHTML = sample[key]
                tr.appendChild(td)
            }
            // model.result[file].forEach((statisticAtom) => {
            //     var name = document.createElement('td')
            //     name.innerHTML = statisticAtom.name
            //     var resultType = document.createElement('td')
            //     resultType.innerHTML = statisticAtom.resultType
            //     var result = document.createElement('td')
            //     result.innerHTML = statisticAtom.result

            //     tr.appendChild(name)
            //     tr.appendChild(resultType)
            //     tr.appendChild(result)
            // })
        })
        this.table.appendChild(tr)
    }
}

export {TextFileOriginalComponentTable, SearchAtomComponentTable, InsightAtomComponentTable, BatchInsightComponentTableDialog, BatchStatisticComponentTableDialog}