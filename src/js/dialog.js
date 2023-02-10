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

class TextFileComponentRegisterCompareGraphDialog extends Dialog
{
    constructor(textFileView){
        super(textFileView.container)
        this.textFileView = textFileView
        this.textFileComponentCompareGraphSequentialChart = ''

        this.desc = ''
        this.markAlias = ''
        this.markTimestampForwardSecond = 0
        this.markTimestampBackwardSecond = 0

        this.init()
    }

    init(){
        this.desc = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Description'))
        this.subContainer.appendChild(this.desc)

        this.markAlias = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Mark Alias'))
        this.subContainer.appendChild(this.markAlias)

        this.markTimestampForwardSecond = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Mark Timestamp Forward Second'))
        this.subContainer.appendChild(this.markTimestampForwardSecond)

        this.markTimestampBackwardSecond = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Mark Timestamp Backward Second'))
        this.subContainer.appendChild(this.markTimestampBackwardSecond)

        // this.textFileComponentCompareGraphSequentialChart = new FileContainerComponentCompareGraphSequentialChart(this, this.subContainer)
        // search and cancel button
        var register = this.createElementButton('REGISTER')
        register.style.width = '50%'
        register.onclick = function(){that.register()}
        var cancel = this.createElementButton('CANCEL')
        cancel.style.backgroundColor = 'red'
        cancel.style.width = '50%'
        cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(register)
        this.subContainer.appendChild(cancel)
    }

    register(){
        compareGraph = {
            desc: this.desc,
            markAlias: this.markAlias,
            markTimestampForwardSecond: this.markTimestampForwardSecond,
            markTimestampBackwardSecond: this.markTimestampBackwardSecond
        }
        this.fileContainerView.registerCompareGraph()
    }

    update(chartAtomModel){

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
        this.subContainer.appendChild(this.createElementHr())
        // alias
        this.alias = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Alias(Global Unique)'))
        this.subContainer.appendChild(this.alias)
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
            alias: this.alias.value,
            desc: this.desc.value,
            exp_search: this.expSearch.value,
            is_case_sensitive: this.isCaseSensitive.checked ? true : false,
            forward_rows: parseInt(this.forwardRows.value),
            backward_rows: parseInt(this.backwardRows.value),
            exp_extract: this.getExpExtractList(),
            exp_mark: this.getExpMarkList(),
        }
        this.searchAtomView.controlExec(model)
    }

    update(model){
        common.removeAllChild(this.expExtractUl)
        common.removeAllChild(this.expMarkUl)
        this.alias.value = model.alias
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

class InsightAtomComponentDialog extends Dialog
{
    constructor(insightAtomView){
        super(insightAtomView.container)
        this.insightAtomView = insightAtomView

        this.alias = ''
        this.desc = ''
        this.expSearch = ''
        this.expExtract = ''
        this.expMark = ''
        this.expMarkColor = ''

        this.init()
    }

    init(){
        let that = this

        // alias
        this.alias = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Alias(Global Unique)'))
        this.subContainer.appendChild(this.alias)

        // search description
        this.desc = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Insight Description'))
        this.subContainer.appendChild(this.desc)

        // search regex express 
        this.expSearch = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Search Express, narrow the scope of insight'))
        this.subContainer.appendChild(this.expSearch)

        // extract key value regex express
        this.expExtract = this.createElementTextInput()
        this.expExtract.style.width = '85%'
        this.subContainer.appendChild(this.createElementHeader('Extract Timestamp Regex Express'))
        this.subContainer.appendChild(this.expExtract)

        // mark key location express
        this.expMarkAlias = this.createElementTextInput()
        this.expMarkAlias.style.width = '10%'
        this.expMark = this.createElementTextInput()
        this.expMark.style.width = '65%'
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
            alias: this.alias.value,
            desc: this.desc.value,
            exp_search: this.expSearch.value,
            exp_extract: this.expExtract.value,
            exp_mark: {'alias':this.expMarkAlias.value, 'exp':this.expMark.value, 'color': this.expMarkColor.value},
        }
        this.insightAtomView.controlExec(model)
    }

    update(model){
        this.alias.value = model.alias
        this.desc.value = model.desc
        this.expSearch.value = model.exp_search
        this.expExtract.value = model.exp_extract

        this.expMarkAlias.value = model.exp_mark.alias
        this.expMark.value = model.exp_mark.exp
        this.expMarkColor.value = model.exp_mark.color

    }
}

class StatisticAtomComponentDialog extends Dialog
{
    constructor(statisticAtomView){
        super(statisticAtomView.container)
        this.statisticAtomView = statisticAtomView

        this.alias = ''
        this.desc = ''
        this.code = ''
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
        codeContainer.appendChild(this.createElementHeader('Alias(Global Unique)'))
        codeContainer.appendChild(this.alias)

        // search description
        this.desc = this.createElementTextInput()
        codeContainer.appendChild(this.createElementHeader('Code Description'))
        codeContainer.appendChild(this.desc)

        //  python code 
        this.code = this.createElementTextarea()
        codeContainer.appendChild(this.createElementHeader('Python Code'))
        codeContainer.appendChild(this.code)

        //  code test result 
        this.result = this.createElementTextarea()
        codeContainer.appendChild(this.createElementHeader('Code Test Result'))
        codeContainer.appendChild(this.result)

        // search and cancel button
        this.apply = this.createElementButton('STATISTIC')
        this.apply.style.width = '33%'
        this.apply.onclick = function(){that.statistic()}
        this.test = this.createElementButton('TEST')
        this.test.style.backgroundColor = 'blue'
        this.test.style.width = '33%'
        this.test.onclick = function(){that.statisticTest()}
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.width = '33%'
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
            code: this.code.value,
        }
        this.statisticAtomView.controlExec(model)
    }

    statisticTest(){
        let model = {
            namespace: this.statisticAtomView.namespace,
            alias: this.alias.value,
            desc: this.desc.value,
            code: this.code.value,
        }
        this.statisticAtomView.controlStatisticTest(model)
    }

    update(model){
        if (this.type == 'code') {
            this.alias.value = model.alias
            this.desc.value = model.desc
            this.code.value = model.code
        }else if (this.type == 'graph') {
            this.graph.draw(model.compareGraph)
        }

    }

    refreshTest(model){
        this.result.value = model.result
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

class BatchInsightComponentDialog extends Dialog
{
    constructor(fileContainerView){
        super(fileContainerView.container)
        this.fileContainerView = fileContainerView
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
        this.fileContainerView.controlBatchInsight(this.dir.value, this.configPath.value)
    }
}

class BatchStatisticComponentDialog extends Dialog
{
    constructor(fileContainerView){
        super(fileContainerView.container)
        this.fileContainerView = fileContainerView
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
        this.fileContainerView.controlBatchStatistic(this.dir.value, this.configPath.value)
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

        // Filter condition
        this.telogFilter = this.createElementTextInput()
        this.telogFilter.style.width = '100%'
        this.subContainer.appendChild(this.createElementHeader('Optional: Telog Filter Condition(Case sensitive, Comma delimited)'))
        this.subContainer.appendChild(this.telogFilter)

        this.elogFilter = this.createElementTextInput()
        this.elogFilter.style.width = '100%'
        this.subContainer.appendChild(this.createElementHeader('Optional: Elog Filter Condition(Case sensitive, Comma delimited)'))
        this.subContainer.appendChild(this.elogFilter)

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
            elog_filter: this.elogFilter.value
        }

        this.fileContainerView.controlDCGMAnalysis(params)
    }
}

class ShareDownloadDialog extends Dialog
{
    constructor(fileContainerView){
        super(fileContainerView.container)
        this.fileContainerView = fileContainerView

        this.configs = []
        // this.init()
    }

    async init(){
        let that = this

        await http.get(urls.query_themes, {
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
                this.container.appendChild(div)
            })

            var download = document.createElement('button')
            download.style.width = "33%"
            download.innerHTML = 'DOWNLOAD'
            download.onclick = function(){that.download()}
            var refresh = document.createElement('button')
            refresh.style.width = "33%"
            refresh.innerHTML = 'REFRESH'
            refresh.onclick = function(){that.refresh()}
            var cancel = document.createElement('button')
            cancel.style.width = "33%"
            cancel.style.backgroundColor = 'red'
            cancel.innerHTML = 'CANCEL'
            cancel.onclick = function(){that.close()}

            this.container.appendChild(download)
            this.container.appendChild(refresh)
            this.container.appendChild(cancel)
            this.modal.appendChild(this.container)
            })
            .catch(function (error) {
                alert('Can not link to sharing service!')
                that.hidden()
            })
    }

    async download(){
        if (process.env.NODE_ENV == 'development'){
            await ipcRenderer.invoke('downloadURL', {url:`http://localhost:8001/download_theme/${this.container.querySelector('input[name="share-download"]:checked').value}`})
        }else{
            await ipcRenderer.invoke('downloadURL', {url:`http://10.166.152.87/share/download_theme/${this.container.querySelector('input[name="share-download"]:checked').value}`})
        }
    }

    refresh(){
        this.deleteAllChilds()
        this.init()
    }
}

export {Dialog, SystemTestComponentDialog, BatchStatisticComponentDialog, BatchInsightComponentDialog, SearchAtomComponentDialog, InsightAtomComponentDialog, StatisticAtomComponentDialog, DCGMAnalysisDialog, ShareDownloadDialog}