import common from '@/plugins/common'
import http from '@/plugins/http'
import urls from '@/plugins/urls'
import { ipcRenderer } from 'electron'

import { Component } from './element'

class Dialog extends Component
{
    constructor(position){
        super(position)
        this.container.style.display = 'none'
        this.container.style.position = 'fixed'
        this.container.style.zIndex = 2
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

class SystemTestComponentDialog extends Dialog
{
    constructor(systemTestView){
        super(systemTestView.container)
        this.systemTestView = systemTestView
        this.dir = ''
        this.configPath = ''
        this.init()
    }

    init(){
        let that = this

        // Files Directory
        this.dir = this.createElementTextInput()
        this.dir.style.width = '85%'
        var browseDir = this.createElementButton('BROWSE')
        browseDir.style.width = '15%'
        browseDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.dir.value = path
            })
        }
        this.subContainer.appendChild(this.createElementHeader('Files Directory'))
        this.subContainer.appendChild(this.dir)
        this.subContainer.appendChild(browseDir)

        // Config path
        this.configPath = this.createElementTextInput()
        this.configPath.style.width = '85%'
        var browseConfig = this.createElementButton('BROWSE')
        browseConfig.style.width = '15%'
        browseConfig.onclick = function(){that.browseConfig()}
        this.subContainer.appendChild(this.createElementHeader('Config Path'))
        this.subContainer.appendChild(this.configPath)
        this.subContainer.appendChild(browseConfig)

        // search and cancel button
        this.apply = this.createElementButton('TEST')
        this.apply.style.width = '50%'
        this.apply.onclick = function(){that.test()}
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.width = '50%'
        this.cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(this.apply)
        this.subContainer.appendChild(this.cancel)
    }

    async browseConfig(){
        let content = await ipcRenderer.invoke('import-config')
        this.configPath.value = content[0]
    }

    test(){
        this.systemTestView.basicTest(this.dir.value, this.configPath.value)
    }
}

class SearchAtomComponentDialog extends Dialog
{
    constructor(searchAtomView){
        super(searchAtomView.container)
        this.searchAtomView = searchAtomView

        this.identifier = ''
        this.desc = ''
        this.expSearch = ''
        this.expExtract = ''
        this.expMark = ''
        this.expMarkColor = ''
        this.expExtractUl = ''
        this.expMarkUl = ''
        this.parentRole = ''
        this.init()
    }

    init(){
        let that = this
        this.subContainer.appendChild(this.createElementHr())
        // identifier
        this.identifier = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Identifier(Global Unique)'))
        this.subContainer.appendChild(this.identifier)
        this.subContainer.appendChild(this.createElementHr())

        // search description
        this.desc = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Search Description'))
        this.subContainer.appendChild(this.desc)
        this.subContainer.appendChild(this.createElementHr())

        // search regular express 
        this.expSearch = this.createElementTextInput()
        var header = this.createElementHeader('Search Express(Python Regular)')
        header.appendChild(this.createElementAHref(' Document', 'https://docs.python.org/3/library/re.html'))
        // header.appendChild(this.createElementAHref('OnlineTest', 'https://www.programiz.com/python-programming/online-compiler/'))
        this.subContainer.appendChild(header)
        this.subContainer.appendChild(this.expSearch)

        var isCaseSensitiveContainer = this.createElementDiv()
        isCaseSensitiveContainer.style.width = '100%'
        this.isCaseSensitive = this.createElementCheckboxInput()
        isCaseSensitiveContainer.append(this.isCaseSensitive)
        isCaseSensitiveContainer.append(this.createElementA(' Is Case Sensitive'))

        var isForwardRowsContainer = this.createElementDiv()
        isForwardRowsContainer.style.width = '100%'
        this.forwardRows = this.createElementTextInput()
        this.forwardRows.style.padding = '3px 5px'
        this.forwardRows.style.width = '5%'
        this.forwardRows.value = '0'
        isForwardRowsContainer.append(this.forwardRows)
        isForwardRowsContainer.append(this.createElementA(' Forward Rows'))

        var isBackwardRowsContainer = this.createElementDiv()
        isBackwardRowsContainer.style.width = '100%'
        this.backwardRows = this.createElementTextInput()
        this.backwardRows.style.padding = '3px 5px'
        this.backwardRows.style.width = '5%'
        this.backwardRows.value = '0'
        isBackwardRowsContainer.append(this.backwardRows)
        isBackwardRowsContainer.append(this.createElementA(' Backward Rows'))

        this.subContainer.appendChild(isCaseSensitiveContainer)
        this.subContainer.appendChild(isForwardRowsContainer)
        this.subContainer.appendChild(isBackwardRowsContainer)
        this.subContainer.appendChild(this.createElementHr())

        // extract key value regular express
        this.expExtract = this.createElementTextInput()
        this.expExtract.style.width = '85%'
        var addExpExtract = this.createElementButton('ADD')
        addExpExtract.style.width = '15%'
        addExpExtract.onclick = function(){that.addExpExtractItem()}
        this.expExtractUl = this.createElementUl()
        
        header = this.createElementHeader('Extract Key Value Express(Python Parse)')
        header.appendChild(this.createElementAHref(' Document', 'https://docs.python.org/3/library/re.html'))
        this.subContainer.appendChild(header)
        this.subContainer.appendChild(this.expExtract)
        this.subContainer.appendChild(addExpExtract)
        this.subContainer.appendChild(this.expExtractUl)
        this.subContainer.appendChild(this.createElementHr())

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
        this.subContainer.appendChild(this.createElementHeader('Mark Location Express(Python Regular)'))
        this.subContainer.appendChild(this.expMarkAlias)
        this.subContainer.appendChild(this.expMark)
        this.subContainer.appendChild(this.expMarkColor)
        this.subContainer.appendChild(addExpMark)
        this.subContainer.appendChild(this.expMarkUl)
        this.subContainer.appendChild(this.createElementHr())

        this.parentRole = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Parent Role, for story lines and hierarchy diagrams (Optional)'))
        this.subContainer.appendChild(this.parentRole)
        this.subContainer.appendChild(this.createElementHr())

        // search and cancel button
        this.apply = this.createElementButton('SEARCH')
        this.apply.style.width = '50%'
        this.apply.onclick = function(){that.search()}
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.width = '50%'
        this.cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(this.apply)
        this.subContainer.appendChild(this.cancel)
    }

    search(){
        let model = {
            namespace: this.searchAtomView.namespace,
            identifier: this.identifier.value,
            desc: this.desc.value,
            exp_search: this.expSearch.value,
            is_case_sensitive: this.isCaseSensitive.checked ? true : false,
            forward_rows: parseInt(this.forwardRows.value),
            backward_rows: parseInt(this.backwardRows.value),
            exp_extract: this.getExpExtractList(),
            exp_mark: this.getExpMarkList(),
            parent_role: this.parentRole.value,
        }
        this.searchAtomView.controlExec(model)
    }

    update(model){
        common.removeAllChild(this.expExtractUl)
        common.removeAllChild(this.expMarkUl)
        this.identifier.value = model.identifier
        this.desc.value = model.desc
        this.expSearch.value = model.exp_search
        this.isCaseSensitive.checked = model.is_case_sensitive
        this.forwardRows.value = model.forward_rows
        this.backwardRows.value = model.backward_rows
        model.exp_extract.forEach((exp) => {
            this.expExtract.value = exp
            this.addExpExtractItem()
        })
        model.exp_mark.forEach((mark) => {
            this.expMarkAlias.value = mark.abbr
            this.expMark.value = mark.exp
            this.expMarkColor.value = mark.color
            this.addExpMarkItem()
        })
        this.parentRole.value = model.parent_role
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
        var keys = ['abbr', 'exp', 'color']
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

class InsightAtomComponentDialog extends Dialog
{
    constructor(insightAtomView){
        super(insightAtomView.container)
        this.insightAtomView = insightAtomView

        this.identifier = ''
        this.desc = ''
        this.expSearch = ''
        this.expExtract = ''
        this.expMark = ''
        this.expMarkColor = ''

        this.init()
    }

    init(){
        let that = this
        this.subContainer.appendChild(this.createElementHr())
        // identifier
        this.identifier = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Identifier(Global Unique)'))
        this.subContainer.appendChild(this.identifier)
        this.subContainer.appendChild(this.createElementHr())

        // search description
        this.desc = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Insight Description'))
        this.subContainer.appendChild(this.desc)
        this.subContainer.appendChild(this.createElementHr())

        // search regular express 
        this.expSearch = this.createElementTextInput()
        var header = this.createElementHeader('Search Express(Python Regular)')
        header.appendChild(this.createElementAHref(' Document', 'https://docs.python.org/3/library/re.html'))
        this.subContainer.appendChild(header)
        this.subContainer.appendChild(this.expSearch)

        var isCaseSensitiveContainer = this.createElementDiv()
        isCaseSensitiveContainer.style.width = '100%'
        this.isCaseSensitive = this.createElementCheckboxInput()
        isCaseSensitiveContainer.append(this.isCaseSensitive)
        isCaseSensitiveContainer.append(this.createElementA(' Is Case Sensitive'))

        var isForwardRowsContainer = this.createElementDiv()
        isForwardRowsContainer.style.width = '100%'
        this.forwardRows = this.createElementTextInput()
        this.forwardRows.style.padding = '3px 5px'
        this.forwardRows.style.width = '5%'
        this.forwardRows.value = '0'
        isForwardRowsContainer.append(this.forwardRows)
        isForwardRowsContainer.append(this.createElementA(' Forward Rows'))

        var isBackwardRowsContainer = this.createElementDiv()
        isBackwardRowsContainer.style.width = '100%'
        this.backwardRows = this.createElementTextInput()
        this.backwardRows.style.padding = '3px 5px'
        this.backwardRows.style.width = '5%'
        this.backwardRows.value = '0'
        isBackwardRowsContainer.append(this.backwardRows)
        isBackwardRowsContainer.append(this.createElementA(' Backward Rows'))

        this.subContainer.appendChild(isCaseSensitiveContainer)
        this.subContainer.appendChild(isForwardRowsContainer)
        this.subContainer.appendChild(isBackwardRowsContainer)
        this.subContainer.appendChild(this.createElementHr())

        // extract key value regular express
        this.expExtract = this.createElementTextInput()
        this.expExtract.style.width = '100%'

        header = this.createElementHeader('Extract Timestamp Regex Express(Python Parse)')
        header.appendChild(this.createElementAHref(' Document', 'https://docs.python.org/3/library/re.html'))
        this.subContainer.appendChild(header)
        this.subContainer.appendChild(this.expExtract)
        this.subContainer.appendChild(this.createElementHr())

        // mark key location express
        this.expMarkAlias = this.createElementTextInput()
        this.expMarkAlias.style.width = '10%'
        this.expMark = this.createElementTextInput()
        this.expMark.style.width = '80%'
        this.expMarkColor = this.createElementColorInput()
        this.subContainer.appendChild(this.createElementHeader('Mark Location Express'))
        this.subContainer.appendChild(this.expMarkAlias)
        this.subContainer.appendChild(this.expMark)
        this.subContainer.appendChild(this.expMarkColor)

        // search and cancel button
        this.apply = this.createElementButton('INSIGHT')
        this.apply.style.width = '50%'
        this.apply.onclick = function(){that.insight()}
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.width = '50%'
        this.cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(this.apply)
        this.subContainer.appendChild(this.cancel)
    }

    insight(){
        let model = {
            namespace: this.insightAtomView.namespace,
            identifier: this.identifier.value,
            desc: this.desc.value,
            exp_search: this.expSearch.value,
            is_case_sensitive: this.isCaseSensitive.checked ? true : false,
            forward_rows: parseInt(this.forwardRows.value),
            backward_rows: parseInt(this.backwardRows.value),
            exp_extract: this.expExtract.value,
            exp_mark: {'abbr':this.expMarkAlias.value, 'exp':this.expMark.value, 'color': this.expMarkColor.value},
        }
        this.insightAtomView.controlExec(model)
    }

    update(model){
        this.identifier.value = model.identifier
        this.desc.value = model.desc
        this.expSearch.value = model.exp_search
        this.isCaseSensitive.checked = model.is_case_sensitive
        this.forwardRows.value = model.forward_rows
        this.backwardRows.value = model.backward_rows
        this.expExtract.value = model.exp_extract
        this.expMarkAlias.value = model.exp_mark.abbr
        this.expMark.value = model.exp_mark.exp
        this.expMarkColor.value = model.exp_mark.color
        this.parentRole.value = model.parent_role
    }
}

class StatisticAtomComponentDialog extends Dialog
{
    constructor(statisticAtomView){
        super(statisticAtomView.container)
        this.statisticAtomView = statisticAtomView

        this.identifier = ''
        this.desc = ''
        this.code = ''
        this.type = 'code'
        this.parentRole = ''
        this.init()
    }

    init(graphAlias){
        let that = this
        
        // var types = ['code', 'graph']
        // this.select = this.createElementSelect()
        // for (var x in types) {
        //     this.select.options[this.select.options.length] = new Option(x, x)
        // }
        // this.subContainer.appendChild(this.select)

        //******************** code *******************/
        var codeContainer = this.createElementDiv()
        codeContainer.appendChild(this.createElementHr())
        // identifier
        this.identifier = this.createElementTextInput()
        codeContainer.appendChild(this.createElementHeader('Identifier(Global Unique)'))
        codeContainer.appendChild(this.identifier)
        codeContainer.appendChild(this.createElementHr())

        // search description
        this.desc = this.createElementTextInput()
        codeContainer.appendChild(this.createElementHeader('Code Description'))
        codeContainer.appendChild(this.desc)
        codeContainer.appendChild(this.createElementHr())

        //  python code 
        this.code = this.createElementTextarea()
        codeContainer.appendChild(this.createElementHeader('Python Code'))
        codeContainer.appendChild(this.code)
        codeContainer.appendChild(this.createElementHr())

        //  code test result 
        this.result = this.createElementTextarea()
        codeContainer.appendChild(this.createElementHeader('Code Test Result'))
        codeContainer.appendChild(this.result)
        this.subContainer.appendChild(this.createElementHr())

        this.parentRole = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Parent Role, for story lines and hierarchy diagrams (Optional)'))
        this.subContainer.appendChild(this.parentRole)
        this.subContainer.appendChild(this.createElementHr())

        // search and cancel button
        this.apply = this.createElementButton('STATISTIC')
        this.apply.style.width = '60%'
        this.apply.onclick = function(){that.statistic()}
        this.test = this.createElementButton('TEST')
        this.test.style.backgroundColor = 'blue'
        this.test.style.width = '20%'
        this.test.onclick = function(){that.statisticTest()}
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.width = '20%'
        this.cancel.onclick = function(){that.hidden()}
        codeContainer.appendChild(this.apply)
        codeContainer.appendChild(this.test)
        codeContainer.appendChild(this.cancel)
        this.subContainer.appendChild(codeContainer)

        //******************** graph *******************/
        // var graphContainer = this.createElementDiv()
        // var graphSelect = this.createElementSelect()
        // this.graph = new SequentialChart(this.container)

        // for (x in graphAlias) {
        //     graphSelect.options[graphSelect.options.length] = new Option(x, x)
        // }
        // graphSelect.onchange = function() {
        //     that.statisticAtomView.getCompareGraph(graphAlias[this.value])
        // }
        // graphContainer.appendChild(graphSelect)

        // this.select.onchange = function() {
        //     if (types[this.value] == 'code') {
        //         that.type = 'code'
        //         codeContainer.style.display = 'block'
        //     }else if (types[this.value] == 'graph') {
        //         that.type = 'graph'
        //         graphContainer.style.display = 'block'
        //     }
        // }
    }

    statistic(){
        let model = {
            namespace: this.statisticAtomView.namespace,
            identifier: this.identifier.value,
            desc: this.desc.value,
            code: this.code.value,
            parent_role: this.parentRole.value,
        }
        this.statisticAtomView.controlExec(model)
    }

    statisticTest(){
        let model = {
            namespace: this.statisticAtomView.namespace,
            identifier: this.identifier.value,
            desc: this.desc.value,
            code: this.code.value,
        }
        this.statisticAtomView.controlStatisticTest(model)
    }

    update(model){
        if (this.type == 'code') {
            this.identifier.value = model.identifier
            this.desc.value = model.desc
            this.code.value = model.code
            this.parentRole.value = model.parent_role
        }else if (this.type == 'graph') {
            this.graph.draw(model.compareGraph)
        }

    }

    refreshTest(model){
        this.result.value = model.result
    }
}

class BatchInsightComponentDialog extends Dialog
{
    constructor(batchInsightView){
        super(batchInsightView.container)
        this.batchInsightView = batchInsightView
        this.dir = ''
        this.configPath = ''
        this.init()
    }

    init(){
        let that = this

        this.subContainer.appendChild(this.createElementHr())
        // Files Directory
        this.dir = this.createElementTextInput()
        this.dir.style.width = '85%'
        var browseDir = this.createElementButton('BROWSE')
        browseDir.style.width = '15%'
        browseDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.dir.value = path
            })
        }
        this.subContainer.appendChild(this.createElementHeader('Files Directory'))
        this.subContainer.appendChild(this.dir)
        this.subContainer.appendChild(browseDir)
        this.subContainer.appendChild(this.createElementHr())

        // Config path
        this.configPath = this.createElementTextInput()
        this.configPath.style.width = '85%'
        var browseConfig = this.createElementButton('BROWSE')
        browseConfig.style.width = '15%'
        browseConfig.onclick = function(){that.browseConfig()}
        this.subContainer.appendChild(this.createElementHeader('Config Path'))
        this.subContainer.appendChild(this.configPath)
        this.subContainer.appendChild(browseConfig)

        this.subContainer.appendChild(this.createElementHr())

        var isSearchBasedContainer = this.createElementDiv()
        isSearchBasedContainer.style.width = '100%'
        this.isSearchBased = this.createElementCheckboxInput()
        isSearchBasedContainer.append(this.isSearchBased)
        isSearchBasedContainer.append(this.createElementA(' Is Based Search'))

        var isIncludeMarkContainer = this.createElementDiv()
        isIncludeMarkContainer.style.width = '100%'
        this.isIncludeMark = this.createElementCheckboxInput()
        isIncludeMarkContainer.append(this.isIncludeMark)
        isIncludeMarkContainer.append(this.createElementA(' Is Include Mark'))

        var isIncludeDiscreteContainer = this.createElementDiv()
        isIncludeDiscreteContainer.style.width = '100%'
        this.isIncludeDiscrete = this.createElementCheckboxInput()
        isIncludeDiscreteContainer.append(this.isIncludeDiscrete)
        isIncludeDiscreteContainer.append(this.createElementA(' Is Include Discrete'))

        var isIncludeConsecutiveContainer = this.createElementDiv()
        isIncludeConsecutiveContainer.style.width = '100%'
        this.isIncludeConsecutive = this.createElementCheckboxInput()
        this.isIncludeConsecutive.checked = true
        isIncludeConsecutiveContainer.append(this.isIncludeConsecutive)
        isIncludeConsecutiveContainer.append(this.createElementA(' Is Include Consecutive'))

        var clusterSelectContainer = this.createElementDiv()
        clusterSelectContainer.style.width = '100%'
        var types = ['auto', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        this.clusterSelect = this.createElementSelect()
        types.forEach((x) => {
            this.clusterSelect.options[this.clusterSelect.options.length] = new Option(x, x)
        })  
        clusterSelectContainer.append(this.clusterSelect)
        clusterSelectContainer.append(this.createElementA(' Cluster Num'))

        this.subContainer.appendChild(isSearchBasedContainer)
        this.subContainer.appendChild(isIncludeMarkContainer)
        this.subContainer.appendChild(isIncludeDiscreteContainer)
        this.subContainer.appendChild(isIncludeConsecutiveContainer)
        this.subContainer.appendChild(clusterSelectContainer)
        this.subContainer.appendChild(this.createElementHr())

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

    async browseConfig(){
        let content = await ipcRenderer.invoke('import-config')
        this.configPath.value = content[0]
    }

    run(){
        let model = {
            dir_path: this.dir.value,
            config_path: this.configPath.value,
            is_search_based: this.isSearchBased.checked ? true : false,
            is_include_mark: this.isIncludeMark.checked ? true : false,
            is_include_discrete: this.isIncludeDiscrete.checked ? true : false,
            is_include_consecutive: this.isIncludeConsecutive.checked ? true : false,
            cluster_num: this.clusterSelect.value
        }
        this.batchInsightView.controlExec(model)
    }
}

class BatchStatisticComponentDialog extends Dialog
{
    constructor(batchStatisticView){
        super(batchStatisticView.container)
        this.batchStatisticView = batchStatisticView
        this.dir = ''
        this.configPath = ''
        this.init()
    }

    init(){
        let that = this

        this.subContainer.appendChild(this.createElementHr())
        // Files Directory
        this.dir = this.createElementTextInput()
        this.dir.style.width = '85%'
        var browseDir = this.createElementButton('BROWSE')
        browseDir.style.width = '15%'
        browseDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.dir.value = path
            })
        }
        this.subContainer.appendChild(this.createElementHeader('Files Directory'))
        this.subContainer.appendChild(this.dir)
        this.subContainer.appendChild(browseDir)
        this.subContainer.appendChild(this.createElementHr())
        
        // Config path
        this.configPath = this.createElementTextInput()
        this.configPath.style.width = '85%'
        var browseConfig = this.createElementButton('BROWSE')
        browseConfig.style.width = '15%'
        browseConfig.onclick = function(){that.browseConfig()}
        this.subContainer.appendChild(this.createElementHeader('Config Path'))
        this.subContainer.appendChild(this.configPath)
        this.subContainer.appendChild(browseConfig)

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

    async browseConfig(){
        let content = await ipcRenderer.invoke('import-config')
        this.configPath.value = content[0]
    }

    run(){
        let model = {
            dir_path: this.dir.value,
            config_path: this.configPath.value
        }
        this.batchStatisticView.controlExec(model)
    }
}

class TextFileCompareComponentDialog extends Dialog
{
    constructor(textFileCompareView){
        super(textFileCompareView.container)
        this.textFileCompareView = textFileCompareView
        this.firstFileNamespace = ''
        this.secondFileNamespace = ''
        this.files = []
        this.init()
    }

    init(){
        let that = this

        this.subContainer.appendChild(this.createElementHr())

        var firstFilesSelectContainer = this.createElementDiv()
        firstFilesSelectContainer.style.width = '100%'
        this.firstFilesSelect = this.createElementSelect()
        this.files.forEach((x) => {
            this.firstFilesSelect.options[this.firstFilesSelect.options.length] = new Option(x, x)
        })  
        firstFilesSelectContainer.append(this.firstFilesSelect)
        firstFilesSelectContainer.append(this.createElementA(' First File Select'))

        var secondFilesSelectContainer = this.createElementDiv()
        secondFilesSelectContainer.style.width = '100%'
        this.secondFilesSelect = this.createElementSelect()
        this.files.forEach((x) => {
            this.secondFilesSelect.options[this.secondFilesSelect.options.length] = new Option(x, x)
        })  
        secondFilesSelectContainer.append(this.secondFilesSelect)
        secondFilesSelectContainer.append(this.createElementA(' Second File Select'))

        this.subContainer.appendChild(firstFilesSelectContainer)
        this.subContainer.appendChild(secondFilesSelectContainer)

        // search and cancel button
        this.apply = this.createElementButton('COMPARE')
        this.apply.style.width = '50%'
        this.apply.onclick = function(){that.run()}
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.width = '50%'
        this.cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(this.apply)
        this.subContainer.appendChild(this.cancel)
    }

    update(model){
        this.files = model.files
        this.firstFilesSelect.innerHTML = ""
        this.secondFilesSelect.innerHTML = ""
        this.files.forEach((x) => {
            this.firstFilesSelect.options[this.firstFilesSelect.options.length] = new Option(x, x)
            this.secondFilesSelect.options[this.secondFilesSelect.options.length] = new Option(x, x)
        })
    }

    run(){
        let model = {
            first_file_namespace: this.firstFilesSelect.value,
            second_file_namespace: this.secondFilesSelect.value
        }
        this.textFileCompareView.controlExec(model)
    }
}

class DCGMAnalysisDialog extends Dialog
{
    constructor(fileContainerView){
        super(fileContainerView.container)
        this.fileContainerView = fileContainerView

        this.dcgmDir = ''
        this.saveDir = ''
        this.telogFilter = ''
        this.elogFilter = ''
        this.init()
    }

    init(){
        let that = this

        this.subContainer.appendChild(this.createElementHr())
        // DCGM Directory
        this.dcgmDir = this.createElementTextInput()
        this.dcgmDir.style.width = '85%'
        var browseDcgmDir = this.createElementButton('BROWSE')
        browseDcgmDir.style.width = '15%'
        browseDcgmDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.dcgmDir.value = path
            })
        }
        this.subContainer.appendChild(this.createElementHeader('DCGM Directory'))
        this.subContainer.appendChild(this.dcgmDir)
        this.subContainer.appendChild(browseDcgmDir)

        // Save Directory
        this.saveDir = this.createElementTextInput()
        this.saveDir.style.width = '85%'
        var browseSaveDir = this.createElementButton('BROWSE')
        browseSaveDir.style.width = '15%'
        browseSaveDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.saveDir.value = path
            })
        }
        this.subContainer.appendChild(this.createElementHeader('Save Directory'))
        this.subContainer.appendChild(this.saveDir)
        this.subContainer.appendChild(browseSaveDir)

        this.subContainer.appendChild(this.createElementHr())
        // Filter condition
        this.telogFilter = this.createElementTextInput()
        this.telogFilter.style.width = '100%'
        this.subContainer.appendChild(this.createElementHeader('Optional: Telog Filter Express(Python regular)'))
        this.subContainer.appendChild(this.telogFilter)

        this.elogFilter = this.createElementTextInput()
        this.elogFilter.style.width = '100%'
        this.subContainer.appendChild(this.createElementHeader('Optional: Elog Filter Express(Python regular)'))
        this.subContainer.appendChild(this.elogFilter)

        var isIntoOneFileContainer = this.createElementDiv()
        isIntoOneFileContainer.style.width = '100%'
        this.isIntoOneFile = this.createElementCheckboxInput()
        isIntoOneFileContainer.append(this.isIntoOneFile)
        isIntoOneFileContainer.append(this.createElementA(' Is Into One File'))
        this.subContainer.appendChild(isIntoOneFileContainer)

        this.subContainer.appendChild(this.createElementHr())
        // search and cancel button
        this.apply = document.createElement('button')
        this.apply.innerHTML = 'RUN'
        this.apply.onclick = function(){that.run()}
        this.cancel = document.createElement('button')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.innerHTML = 'CANCEL'
        this.cancel.onclick = function(){that.hidden()}

        this.subContainer.appendChild(this.apply)
        this.subContainer.appendChild(this.cancel)
    }

    run(){
        let params = {
            dcgm_dir: this.dcgmDir.value,
            save_dir: this.saveDir.value,
            telog_filter: this.telogFilter.value,
            elog_filter: this.elogFilter.value,
            is_into_one_file: this.isIntoOneFile.checked ? true : false,
        }

        this.fileContainerView.controlDCGMAnalysis(params)
    }
}

class TelogAnalysisDialog extends Dialog
{
    constructor(fileContainerView){
        super(fileContainerView.container)
        this.fileContainerView = fileContainerView

        this.telogDir = ''
        this.saveDir = ''
        this.telogFilter = ''
        this.init()
    }

    init(){
        let that = this

        // Telog Directory
        this.telogDir = this.createElementTextInput()
        this.telogDir.style.width = '85%'
        var browseTelogDir = this.createElementButton('BROWSE')
        browseTelogDir.style.width = '15%'
        browseTelogDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.telogDir.value = path
            })
        }
        this.subContainer.appendChild(this.createElementHeader('Telog Directory'))
        this.subContainer.appendChild(this.telogDir)
        this.subContainer.appendChild(browseTelogDir)

        // Save Directory
        this.saveDir = this.createElementTextInput()
        this.saveDir.style.width = '85%'
        var browseSaveDir = this.createElementButton('BROWSE')
        browseSaveDir.style.width = '15%'
        browseSaveDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.saveDir.value = path
            })
        }
        this.subContainer.appendChild(this.createElementHeader('Save Directory'))
        this.subContainer.appendChild(this.saveDir)
        this.subContainer.appendChild(browseSaveDir)

        // Filter condition
        this.telogFilter = this.createElementTextInput()
        this.telogFilter.style.width = '100%'
        this.subContainer.appendChild(this.createElementHeader('Optional: Telog Filter Condition(Case sensitive, Comma delimited)'))
        this.subContainer.appendChild(this.telogFilter)

        // search and cancel button
        this.apply = document.createElement('button')
        this.apply.innerHTML = 'RUN'
        this.apply.onclick = function(){that.run()}
        this.cancel = document.createElement('button')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.innerHTML = 'CANCEL'
        this.cancel.onclick = function(){that.hidden()}

        this.subContainer.appendChild(this.apply)
        this.subContainer.appendChild(this.cancel)
    }

    run(){
        let params = {
            telog_dir: this.telogDir.value,
            save_dir: this.saveDir.value,
            telog_filter: this.telogFilter.value
        }

        this.fileContainerView.controlTelogAnalysis(params)
    }
}

class ShareDownloadDialog extends Dialog
{
    constructor(fileContainerView){
        super(fileContainerView.container)
        this.fileContainerView = fileContainerView

        this.configs = []
        if (process.env.NODE_ENV === 'production') {
            this.init()
        }
    }

    async init(){
        let that = this

        await http.get(urls.query_configs, {
            params: {
            },
            })
          .then(response => {
            this.configs = response.data.configs
            this.configs.forEach((config) => {
                var div = document.createElement("div")
                div.style.width = '100%'
                div.style.display = 'block'
                div.style.position = 'relative'
                var input = document.createElement("input")
                input.style.float = 'left'
                input.style.cursor = 'pointer'
                input.type = 'radio'
                input.value = config
                input.name = 'share-download'
                var label = document.createElement("h4")
                label.style.color = '#FFF'
                label.innerHTML = config
                div.appendChild(input)
                div.appendChild(label)
                this.subContainer.appendChild(div)
            })

            let that = this
            this.downloadBtn = this.createElementButton('DOWNLOAD')
            this.downloadBtn.style.width = "33%"
            this.downloadBtn.onclick = function(){that.download()}
            this.refreshBtn = this.createElementButton('REFRESH')
            this.refreshBtn.style.width = "33%"
            this.refreshBtn.style.backgroundColor = 'grey'
            this.refreshBtn.onclick = function(){that.refresh()}
            this.cancelBtn = this.createElementButton('CANCEL')
            this.cancelBtn.style.width = "34%"
            this.cancelBtn.style.backgroundColor = 'red'
            this.cancelBtn.onclick = function(){that.hidden()}
    
            this.subContainer.appendChild(this.downloadBtn)
            this.subContainer.appendChild(this.refreshBtn)
            this.subContainer.appendChild(this.cancelBtn)
            })
            .catch(function (error) {
                alert('Can not link to sharing service!')
                that.hidden()
            })
    }
    async upload(){
        let content = await ipcRenderer.invoke('import-config')
        if(content[1] != ''){
            await http.get(urls.save_config, {
                params: {
                    filename: content[0],
                    config: content[1]
                },
                })
              .then(response => {
                    console.log(response.data)
            }).catch(function (error) {
                alert('Can not link to sharing service!')
            })
        }
    }

    async download(){
        if (process.env.NODE_ENV == 'development'){
            await ipcRenderer.invoke('downloadURL', {url:`http://localhost:8001/download_config/${this.container.querySelector('input[name="share-download"]:checked').value}`})
        }else{
            await ipcRenderer.invoke('downloadURL', {url:`http://10.166.152.87/share/download_config/${this.container.querySelector('input[name="share-download"]:checked').value}`})
        }
    }

    refresh(){
        this.deleteDomAllChilds(this.subContainer)
        this.init()
    }
}

export {Dialog, SystemTestComponentDialog, TextFileCompareComponentDialog, BatchStatisticComponentDialog, BatchInsightComponentDialog, SearchAtomComponentDialog, InsightAtomComponentDialog, StatisticAtomComponentDialog, DCGMAnalysisDialog, TelogAnalysisDialog, ShareDownloadDialog}