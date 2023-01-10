import common from '@/plugins/common'
import { ipcRenderer } from 'electron'

import { Component } from './element'
import { SequentialChart } from './chart'

class Dialog extends Component
{
    constructor(position){
        super(position)
        this.container.style.display = 'none'
        this.container.style.position = 'fixed'
        this.container.style.zIndex = 1
        this.container.style.left = 0
        this.container.style.top = 0
        this.container.style.width = '100%'
        this.container.style.height = '100%'
        this.container.style.overflow = 'auto'

        this.subContainer = document.createElement('div')
        this.subContainer.style.backgroundColor = '#333'
        this.subContainer.style.color = 'white'
        this.subContainer.style.width = '40%'
        this.subContainer.style.border = '1px solid #888'
        this.subContainer.style.margin = '5% auto 15% auto'

        this.container.appendChild(this.subContainer)
    }

    async browseFilesDirectory(_callback){
        let content = await ipcRenderer.invoke('open-dir')
        _callback(content.filePaths[0])
    }
}

class SearchAtomComponentDialog extends Dialog
{
    constructor(searchAtomView){
        super(searchAtomView.container)
        this.searchAtomView = searchAtomView

        this.alias = ''
        this.desc = ''
        this.expSearch = ''
        this.expExtract = ''
        this.expMark = ''
        this.expMarkColor = ''
        this.expExtractUl = ''
        this.expMarkUl = ''

        this.init()
    }

    init(){
        let that = this

        // alias
        this.alias = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Alias(Global Unique)'))
        this.subContainer.appendChild(this.alias)

        // search description
        this.desc = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Search Description'))
        this.subContainer.appendChild(this.desc)

        // search regex express 
        this.expSearch = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Search Express'))
        this.subContainer.appendChild(this.expSearch)

        // extract key value regex express
        this.expExtract = this.createElementTextInput()
        this.expExtract.style.width = '85%'
        var addExpExtract = this.createElementButton('ADD')
        addExpExtract.style.width = '15%'
        addExpExtract.onclick = function(){that.addExpExtractItem()}
        this.expExtractUl = this.createElementUl()
        this.subContainer.appendChild(this.createElementH4('Extract Key Value Regex Express'))
        this.subContainer.appendChild(this.expExtract)
        this.subContainer.appendChild(addExpExtract)
        this.subContainer.appendChild(this.expExtractUl)

        // mark key location express
        this.expMarkAlias = this.createElementTextInput()
        this.expMarkAlias.style.width = '10%'
        this.expMark = this.createElementTextInput()
        this.expMark.style.width = '65%'
        this.expMarkColor = this.createElementColorInput()
        var addExpMark = this.createElementButton('ADD')
        addExpMark.style.width = '15%'
        addExpMark.onclick = function(){that.addExpMarkItem()}
        this.expMarkUl = this.createElementUl()
        this.subContainer.appendChild(this.createElementH4('Mark Key Location Express'))
        this.subContainer.appendChild(this.expMarkAlias)
        this.subContainer.appendChild(this.expMark)
        this.subContainer.appendChild(this.expMarkColor)
        this.subContainer.appendChild(addExpMark)
        this.subContainer.appendChild(this.expMarkUl)

        // search and cancel button
        var apply = this.createElementButton('SEARCH')
        apply.style.width = '50%'
        apply.onclick = function(){that.search()}
        var cancel = this.createElementButton('CANCEL')
        cancel.style.backgroundColor = 'red'
        cancel.style.width = '50%'
        cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(apply)
        this.subContainer.appendChild(cancel)
    }

    search(){
        let model = {
            namespace: this.searchAtomView.namespace,
            alias: this.alias.value,
            desc: this.desc.value,
            exp_search: this.expSearch.value,
            exp_extract: this.getExpExtractList(),
            exp_mark: this.getExpMarkList(),
        }
        this.searchAtomView.search(model)
    }

    update(model){
        this.alias.value = model.alias
        this.desc.value = model.desc
        this.expSearch.value = model.expSearch
        model.expExtract.forEach((exp) => {
            this.expExtract.value = exp
            this.addExpExtractItem()
        })
        model.expMark.forEach((mark) => {
            this.expMarkAlias.value = mark.alias
            this.expMark.value = mark.exp
            this.expMarkColor.value = mark.color
            this.addExpMarkItem()
        })
    }

    addExpExtractItem(){
        let that = this
        var li = this.createElementLi()

        var t = this.createElementTextInput()
        t.setAttribute('value', this.expExtract.value)
        t.style.width = '92%'
        var x = this.createElementButton('X')
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.onclick = function(){that.deleteItem(x)}

        li.appendChild(t)
        li.appendChild(x)
        this.expExtractUl.append(li)
    }

    addExpMarkItem(){
        let that = this
        var li = this.createElementLi()

        var a = this.createElementTextInput()
        a.setAttribute('value', this.expMarkAlias.value)
        a.style.width = '10%'
        var t = this.createElementTextInput()
        t.setAttribute('value', this.expMark.value)
        t.style.width = '72%'
        var c = this.createElementColorInput()
        c.setAttribute('value', this.expMarkColor.value)
        var x = this.createElementButton('X')
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.onclick = function(){that.deleteItem(x)}

        li.appendChild(a)
        li.appendChild(t)
        li.appendChild(c)
        li.appendChild(x)
        this.expMarkUl.append(li)
    }

    getExpExtractList(){
        var expExtracts = []
        for (const li of this.expExtractUl.children) {
            for (const elm of li.children) {
                if (elm.tagName == 'INPUT'){
                    expExtracts.push(elm.value)
                }
            }
        }
        return expExtracts
    }

    getExpMarkList(){
        var expMarks = []
        var keys = ['alias', 'exp', 'color']
        for (const li of this.expMarkUl.children) {
            var item = {}
            var count = 0
            for (const elm of li.children) {
                if (elm.tagName == 'INPUT'){
                    item[keys[count]] = elm.value
                    count = count + 1
                }
            }
            expMarks.push(item)
        }
        return expMarks
    }

    deleteItem(item){
        common.removeAll(item.parentNode)
    }
}

class ChartAtomComponentSvgDialog extends Dialog
{
    constructor(chartAtomView){
        super(chartAtomView.container)
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`
    }
}

class StatisticAtomComponentDialog extends Dialog
{
    constructor(statisticAtomView){
        super(statisticAtomView.container)
        this.statisticAtomView = statisticAtomView

        this.alias = ''
        this.desc = ''
        this.exp = ''
        this.type = 'code'

        this.init()
    }

    init(graphAlias){
        let that = this
        
        var types = ['code', 'graph']
        this.select = this.createElementSelect()
        for (var x in types) {
            this.select.options[this.select.options.length] = new Option(x, x)
        }
        this.subContainer.appendChild(this.select)

        //******************** code *******************/
        var codeContainer = this.createElementDiv()

        // alias
        this.alias = this.createElementTextInput()
        codeContainer.appendChild(this.createElementH4('Alias(Global Unique)'))
        codeContainer.appendChild(this.alias)

        // search description
        this.desc = this.createElementTextInput()
        codeContainer.appendChild(this.createElementH4('Express Description'))
        codeContainer.appendChild(this.desc)

        // search regex express 
        this.exp = this.createElementTextInput()
        codeContainer.appendChild(this.createElementH4('Python Express'))
        codeContainer.appendChild(this.exp)

        // search and cancel button
        var apply = this.createElementButton('STATISTIC')
        apply.style.width = '50%'
        apply.onclick = function(){that.statistic()}
        var cancel = this.createElementButton('CANCEL')
        cancel.style.backgroundColor = 'red'
        cancel.style.width = '50%'
        cancel.onclick = function(){that.hidden()}
        codeContainer.appendChild(apply)
        codeContainer.appendChild(cancel)
        this.subContainer.appendChild(codeContainer)

        //******************** graph *******************/
        var graphContainer = this.createElementDiv()
        var graphSelect = this.createElementSelect()
        this.graph = new SequentialChart(this.container)

        for (var x in graphAlias) {
            graphSelect.options[graphSelect.options.length] = new Option(x, x)
        }
        graphSelect.onchange = function() {
            that.statisticAtomView.getCompareGraph(graphAlias[this.value])
        }
        graphContainer.appendChild(graphSelect)

        this.select.onchange = function() {
            if (types[this.value] == 'code') {
                that.type = 'code'
                codeContainer.style.display = 'block'
            }else if (types[this.value] == 'graph') {
                that.type = 'graph'
                graphContainer.style.display = 'block'
            }
        }
    }

    statistic(){
        let model = {
            namespace: this.statisticAtomView.namespace,
            alias: this.alias.value,
            desc: this.desc.value,
            exp: this.exp.value,
        }
        this.statisticAtomView.statistic(model)
    }

    update(model){
        if (this.type == 'code') {
            this.alias.value = model.alias
            this.desc.value = model.desc
            this.exp.value = model.exp
        }else if (this.type == 'graph') {
            this.graph.draw(model.compareGraph)
        }

    }
}

export {SearchAtomComponentDialog, ChartAtomComponentSvgDialog, StatisticAtomComponentDialog}