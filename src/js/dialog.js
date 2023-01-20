import common from '@/plugins/common'
import http from '@/plugins/http'
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
        this.subContainer.appendChild(this.createElementH4('Description'))
        this.subContainer.appendChild(this.desc)

        this.markAlias = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Mark Alias'))
        this.subContainer.appendChild(this.markAlias)

        this.markTimestampForwardSecond = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Mark Timestamp Forward Second'))
        this.subContainer.appendChild(this.markTimestampForwardSecond)

        this.markTimestampBackwardSecond = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Mark Timestamp Backward Second'))
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
        this.searchAtomView.controlSearch(model)
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
        this.subContainer.appendChild(this.createElementH4('Extract Key Value Regex Express'))
        this.subContainer.appendChild(this.expExtract)

        // mark key location express
        this.expMarkAlias = this.createElementTextInput()
        this.expMarkAlias.style.width = '10%'
        this.expMark = this.createElementTextInput()
        this.expMark.style.width = '65%'
        this.expMarkColor = this.createElementColorInput()
        this.subContainer.appendChild(this.createElementH4('Mark Key Location Express'))
        this.subContainer.appendChild(this.expMarkAlias)
        this.subContainer.appendChild(this.expMark)
        this.subContainer.appendChild(this.expMarkColor)

        // search and cancel button
        var apply = this.createElementButton('INSIGHT')
        apply.style.width = '50%'
        apply.onclick = function(){that.insight()}
        var cancel = this.createElementButton('CANCEL')
        cancel.style.backgroundColor = 'red'
        cancel.style.width = '50%'
        cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(apply)
        this.subContainer.appendChild(cancel)
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
        this.insightAtomView.controlInsight(model)
    }

    update(model){
        this.alias.value = model.alias
        this.desc.value = model.desc
        this.expSearch.value = model.expSearch
        this.expExtract.value = model.expExtract

        this.expMarkAlias.value = model.expMark.alias
        this.expMark.value = model.expMark.exp
        this.expMarkColor.value = model.expMark.color

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
            exp: this.exp.value,
        }
        this.statisticAtomView.controlStatistic(model)
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
        this.subContainer.appendChild(this.createElementH4('Files Directory'))
        this.subContainer.appendChild(this.dir)
        this.subContainer.appendChild(browseDir)

        // Config path
        this.configPath = this.createElementTextInput()
        this.configPath.style.width = '85%'
        var browseConfig = this.createElementButton('BROWSE')
        browseConfig.style.width = '15%'
        browseConfig.onclick = function(){that.browseConfig()}
        this.subContainer.appendChild(this.createElementH4('Config Path'))
        this.subContainer.appendChild(this.configPath)
        this.subContainer.appendChild(browseConfig)

        // search and cancel button
        var apply = this.createElementButton('RUN')
        apply.style.width = '50%'
        apply.onclick = function(){that.apply()}
        var cancel = this.createElementButton('CANCEL')
        cancel.style.backgroundColor = 'red'
        cancel.style.width = '50%'
        cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(apply)
        this.subContainer.appendChild(cancel)
    }

    async browseConfig(){
        let content = await ipcRenderer.invoke('import-config')
        this.configPath.value = content[0]
    }

    apply(){
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
        this.subContainer.appendChild(this.createElementH4('Files Directory'))
        this.subContainer.appendChild(this.dir)
        this.subContainer.appendChild(browseDir)

        // Config path
        this.configPath = this.createElementTextInput()
        this.configPath.style.width = '85%'
        var browseConfig = this.createElementButton('BROWSE')
        browseConfig.style.width = '15%'
        browseConfig.onclick = function(){that.browseConfig()}
        this.subContainer.appendChild(this.createElementH4('Config Path'))
        this.subContainer.appendChild(this.configPath)
        this.subContainer.appendChild(browseConfig)

        // search and cancel button
        var apply = this.createElementButton('RUN')
        apply.style.width = '50%'
        apply.onclick = function(){that.apply()}
        var cancel = this.createElementButton('CANCEL')
        cancel.style.backgroundColor = 'red'
        cancel.style.width = '50%'
        cancel.onclick = function(){that.hidden()}
        this.subContainer.appendChild(apply)
        this.subContainer.appendChild(cancel)
    }

    async browseConfig(){
        let content = await ipcRenderer.invoke('import-config')
        this.configPath.value = content[0]
    }

    apply(){
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
        this.subContainer.appendChild(this.createElementH4('DCGM Directory'))
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
        this.subContainer.appendChild(this.createElementH4('Save Directory'))
        this.subContainer.appendChild(this.saveDir)
        this.subContainer.appendChild(browseSaveDir)

        // Filter condition
        this.telogFilter = this.createElementTextInput()
        this.telogFilter.style.width = '100%'
        this.subContainer.appendChild(this.createElementH4('Optional: Telog Filter Condition(Case sensitive, Comma delimited)'))
        this.subContainer.appendChild(this.telogFilter)

        this.elogFilter = this.createElementTextInput()
        this.elogFilter.style.width = '100%'
        this.subContainer.appendChild(this.createElementH4('Optional: Elog Filter Condition(Case sensitive, Comma delimited)'))
        this.subContainer.appendChild(this.elogFilter)

        // search and cancel button
        var apply = document.createElement('button')
        apply.innerHTML = 'RUN'
        apply.onclick = function(){that.apply()}
        var cancel = document.createElement('button')
        cancel.style.backgroundColor = 'red'
        cancel.innerHTML = 'CANCEL'
        cancel.onclick = function(){that.hidden()}

        this.subContainer.appendChild(apply)
        this.subContainer.appendChild(cancel)
    }

    apply(){
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
        this.init()
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

export {Dialog, BatchStatisticComponentDialog, BatchInsightComponentDialog, SearchAtomComponentDialog, InsightAtomComponentDialog, StatisticAtomComponentDialog, DCGMAnalysisDialog, ShareDownloadDialog}