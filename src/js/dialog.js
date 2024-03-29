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
        
        header = this.createElementHeader('Extract keyvalue express, describe state(Python Parse)')
        header.appendChild(this.createElementAHref(' Document', 'https://pypi.org/project/parse/'))
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
        this.subContainer.appendChild(this.createElementHeader('Mark Location Express, describe action(Python Regular)'))
        this.subContainer.appendChild(this.expMarkAlias)
        this.subContainer.appendChild(this.expMark)
        this.subContainer.appendChild(this.expMarkColor)
        this.subContainer.appendChild(addExpMark)
        this.subContainer.appendChild(this.expMarkUl)
        this.subContainer.appendChild(this.createElementHr())

        this.rolePath = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Describe module/role hierarchy. (Optional)'))
        this.subContainer.appendChild(this.rolePath)
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

    model(){
        return {
            namespace: this.searchAtomView.namespace,
            identifier: this.identifier.value,
            desc: this.desc.value,
            exp_search: this.expSearch.value,
            is_case_sensitive: this.isCaseSensitive.checked ? true : false,
            forward_rows: parseInt(this.forwardRows.value),
            backward_rows: parseInt(this.backwardRows.value),
            exp_extract: this.getExpExtractList(),
            exp_mark: this.getExpMarkList(),
            role_path: this.rolePath.value,
            is_active: this.searchAtomView.show.table.style.display === "none" ? false : true
        }
    }

    search(){ 
        this.searchAtomView.controlExec(this.model())
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
        this.rolePath.value = model.role_path
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
        this.subContainer.style.width = '80%'
        this.identifier = ''
        this.desc = ''
        this.script = ''
        this.rolePath = ''
        this.init()
    }

    init(){
        let that = this

        // identifier
        this.identifier = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Identifier(Global Unique)'))
        this.subContainer.appendChild(this.identifier)
        this.subContainer.appendChild(this.createElementHr())

        // description
        this.desc = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Script Description'))
        this.subContainer.appendChild(this.desc)
        this.subContainer.appendChild(this.createElementHr())

        //  python script 
        var textarea = this.createElementTextarea()
        this.subContainer.appendChild(this.createElementHeader('Python Script'))
        this.subContainer.appendChild(textarea)
        this.script = this.createPythonCodeMirror(textarea)

        //  script test result 
        this.result = this.createElementTextarea()
        this.subContainer.appendChild(this.createElementHeader('Script Test Result'))
        this.subContainer.appendChild(this.result)
        this.subContainer.appendChild(this.createElementHr())

        this.rolePath = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Describe module/role hierarchy. (Optional)'))
        this.subContainer.appendChild(this.rolePath)

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
        this.subContainer.appendChild(this.apply)
        this.subContainer.appendChild(this.test)
        this.subContainer.appendChild(this.cancel)
    }

    // pythonHint(editor){
    //     const word = /[A-Za-z_0-9]+/
    //     const cur = editor.getCursor()
    //     const curLine = editor.getLine(cur.line)
    //     const curWord = curLine.slice(0, cur.ch).match(word)
    //     const suggestions = ['print', 'prkkint', 'def', 'if', 'else', 'while', 'for', 'return']
    //     console.log(cur,curLine,curWord)
    //     if (curWord) {
    //         const prefix = curWord[0]
    //         const matching = suggestions.filter((suggestion) => suggestion.startsWith(prefix))
    //         if (matching.length > 0) {
    //             return {
    //                 list: matching,
    //                 from: CodeMirror.Pos(cur.line, cur.ch - prefix.length),
    //                 to: CodeMirror.Pos(cur.line, cur.ch)
    //             }
    //         }
    //     }
    // }

    model(){
        return {
            namespace: this.statisticAtomView.namespace,
            identifier: this.identifier.value,
            desc: this.desc.value,
            script: this.script.getValue(),
            role_path: this.rolePath.value,
            is_active: this.statisticAtomView.show.container.style.display === "none" ? false : true
        }
    }

    statistic(){
        this.statisticAtomView.controlExec(this.model())
    }

    statisticTest(){
        let model = {
            namespace: this.statisticAtomView.namespace,
            identifier: this.identifier.value,
            desc: this.desc.value,
            script: this.script.getValue(),
        }
        this.statisticAtomView.controlStatisticTest(model)
    }

    update(model){
        this.identifier.value = model.identifier
        this.desc.value = model.desc
        this.script.setValue(model.script)
        this.script.setSize(null, parseInt(document.body.offsetHeight / 2))
        let that = this
        setTimeout(function() {
            that.script.refresh()
        }, 100)
        this.script.scrollIntoView({ line: 0, ch: 0 }, 0)
        this.rolePath.value = model.role_path
    }

    refreshTest(model){
        this.result.value = model.result
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
        // this.files.forEach((x) => {
        //     this.firstFilesSelect.options[this.firstFilesSelect.options.length] = new Option(x, x)
        // })  
        firstFilesSelectContainer.append(this.firstFilesSelect)
        firstFilesSelectContainer.append(this.createElementA(' First File Select'))

        var secondFilesSelectContainer = this.createElementDiv()
        secondFilesSelectContainer.style.width = '100%'
        this.secondFilesSelect = this.createElementSelect()
        // this.files.forEach((x) => {
        //     this.secondFilesSelect.options[this.secondFilesSelect.options.length] = new Option(x, x)
        // })  
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
            this.firstFilesSelect.options[this.firstFilesSelect.options.length] = new Option(model.id_map[x], x)
            this.secondFilesSelect.options[this.secondFilesSelect.options.length] = new Option(model.id_map[x], x)
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

class ShareDownloadDialog extends Dialog
{
    constructor(fileContainerView){
        super(fileContainerView.container)
        this.fileContainerView = fileContainerView
        this.init()
    }

    init(){
        let that = this

        var configFilter = this.createElementTextInput()
        configFilter.placeholder = 'Input filter key word...'
        var configHeader = this.createElementHeader('Config')
        this.configsUl = this.createElementUl()
        this.subContainer.appendChild(configHeader)
        this.subContainer.appendChild(configFilter)
        this.subContainer.appendChild(this.configsUl)
        configFilter.addEventListener('keyup', function() {
            var filter = this.value.toUpperCase();
            var lis = that.configsUl.querySelectorAll('li')
            for (var i = 0; i < lis.length; i++) {
                var content = lis[i].getElementsByTagName('input')[0].value.toUpperCase();
                if (content.indexOf(filter) > -1) { 
                    lis[i].style.display = 'block';
                } else { 
                    lis[i].style.display = 'none';
                }
            }
        })

        this.subContainer.appendChild(this.createElementHr())
        var scriptFilter = this.createElementTextInput()
        scriptFilter.placeholder = 'Input filter key word...'
        var scriptHeader = this.createElementHeader('Script')
        this.scriptsUl = this.createElementUl()
        this.subContainer.appendChild(scriptHeader)
        this.subContainer.appendChild(scriptFilter)
        this.subContainer.appendChild(this.scriptsUl)
        scriptFilter.addEventListener('keyup', function() {
            var filter = this.value.toUpperCase();
            var lis = that.scriptsUl.querySelectorAll('li')
            for (var i = 0; i < lis.length; i++) {
                var content = lis[i].getElementsByTagName('input')[0].value.toUpperCase();
                if (content.indexOf(filter) > -1) { 
                    lis[i].style.display = 'block';
                } else { 
                    lis[i].style.display = 'none';
                }
            }
        })

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
    }

    addItem(ul, content){
        var li = this.createElementLi()
        li.style.border = '1px solid #bbb'
        li.style.listStyle = 'none'
        var div = this.createElementDiv()
        div.style.width = '100%'
        div.style.position = 'relative'
        var input = this.createElementCheckboxInput()
        input.style.display = 'inline-block'
        input.style.cursor = 'pointer'
        input.value = content
        input.name = 'share'
        input.id = content
        var label = this.createElementLabel(content, content)
        label.style.fontSize = '20px'
        label.style.display = 'inline-block'
        label.style.width = '95%'
        label.style.cursor = 'pointer';
        div.appendChild(input)
        div.appendChild(label)
        li.appendChild(div)
        div.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#555'
        });
        div.addEventListener('mouseout', function() {
            this.style.backgroundColor = '#333'
        });
        ul.append(li)
    }

    async query(){
        let that = this
        await http.get(urls.query_configs, {
            params: {
            },
            })
            .then(response => {
                var contents = response.data.configs
                contents.forEach((content) => {
                    if(content.includes('.ecfg')){
                        that.addItem(that.configsUl, content)
                    }else if(content.includes('.escp')){
                        that.addItem(that.scriptsUl, content)
                    }
                })
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
        let that = this
        this.browseFilesDirectory(function(path) {
            var downloadUrlList = []
            that.container.querySelectorAll('input[name="share"]:checked').forEach(node => {
                if (process.env.NODE_ENV == 'development'){
                    downloadUrlList.push(`http://localhost:8001/download_config/${node.value}`)
                }else{
                    downloadUrlList.push(`http://10.166.152.87/share/download_config/${node.value}`)
                }
            })
            ipcRenderer.invoke('downloadURL', path, downloadUrlList)
        })
    }

    refresh(){
        this.deleteDomAllChilds(this.subContainer)
        this.init()
        this.query()
    }
}

export {Dialog, SystemTestComponentDialog, TextFileCompareComponentDialog, SearchAtomComponentDialog, InsightAtomComponentDialog, StatisticAtomComponentDialog, ShareDownloadDialog}