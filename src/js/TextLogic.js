import * as d3 from "d3"
import * as echarts from 'echarts'
import urls from '@/plugins/urls'
import service from '@/plugins/http'
import common from '@/plugins/common'

import { ipcRenderer } from 'electron'


class TextLogicView
{
    constructor(){
        this.containerFiles = {}
        this.topMenu = ''
        this.tablinks = ''
        this.tabcontents = ''
        this.activeFile = ''
    }

    init(){
        // init top menu
        this.topMenu = new TopMenu(this)
        // init file viewer
        this.tablinks = document.createElement('div')
        this.tablinks.setAttribute('id', 'tablinks')

        this.tabcontents = document.createElement('div')
        this.tabcontents.setAttribute('id', 'tabcontents')

        var screen = document.getElementById('screen')
        screen.append(this.tablinks)
        screen.append(this.tabcontents)
    }

    openPage(name, element)
    {
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablink");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].style.backgroundColor = "#555";
        }
        document.getElementById(name).style.display = "block";
        element.style.backgroundColor = "#333";
        this.activeFile = name.replace('-tabcontent', '')
    }

    deleteFile(uid){
        // this.containerFiles[uid].delete()
        // delete this.containerFiles[uid]
    }

}

class TopMenu
{
    constructor(parent){
        this.parent = parent
        this.globalKeyValueTree = ''
        this.globalKeyValueSelect = {}
        this.globalSequentialChart = ''

        this.init()
    }

    init(){
        let that = this
        ipcRenderer.on('open-file', async function () {
            let file = await ipcRenderer.invoke('open-file')
            if(!file.canceled){
                new FileViewer(that.parent, file)
            }
        })
        ipcRenderer.on('save', async function () {
            if (that.parent.containerFiles[that.parent.activeFile].configPath == ''){
                let file = await ipcRenderer.invoke('save-as', JSON.stringify(that.parent.containerFiles[that.parent.activeFile].saveConfig()))
                that.parent.containerFiles[that.parent.activeFile].configPath = file.filePaths[0]
            }else{
                await ipcRenderer.invoke('save-auto', that.parent.containerFiles[that.parent.activeFile].configPath, JSON.stringify(that.parent.containerFiles[that.parent.activeFile].saveConfig()))
            }
        })
        ipcRenderer.on('save-as', async () => {
            let file = await ipcRenderer.invoke('save-as', JSON.stringify(that.parent.containerFiles[that.parent.activeFile].configContent))
            that.parent.containerFiles[that.parent.activeFile].saveConfig(file)
        })
        ipcRenderer.on('load', async () => {
            let content = await ipcRenderer.invoke('open-config')
            that.parent.containerFiles[that.parent.activeFile].loadConfig(content)
        })
        ipcRenderer.on('new-search', () => {
            that.newSearchDialog()
        })
        ipcRenderer.on('keyword-tree', () => {
            that.newKeyValueTreeDialog()
        })
        ipcRenderer.on('global-keyword-tree', () => {
            that.openGlobalKeyValueTree()
        })
    }

    newSearchDialog(){
        this.parent.containerFiles[this.parent.activeFile].newSearch()
    }

    newKeyValueTreeDialog(){
        this.parent.containerFiles[this.parent.activeFile].openKeyValueTree()
    }

    generateGlobalKeyValueTree(){
        if ('children' in this.globalKeyValueSelect) {
            var ownChild = []
            this.globalKeyValueSelect['children'].forEach((child) => {
                ownChild.push(child.uid)
            })
            Object.keys(this.parent.containerFiles).forEach((file) => {
                if (!ownChild.includes(file)) {
                    var kvs = []
                    Object.keys(this.parent.containerFiles[file].searchContainer).forEach((uid) => {
                        var keys = []
                        Object.keys(this.parent.containerFiles[file].searchContainer[uid].res.res_kv).forEach((key) => {
                            keys.push({'name': key, 'check': false})
                        })
                        kvs.push({'uid': uid, 'name': this.parent.containerFiles[file].searchContainer[uid].ins.desc.value, 'check': false, 'children': keys})
                    })
                    this.globalKeyValueSelect['children'].push({'uid': file, 'name': file, 'check': false, 'children': kvs})
                }
            })
        }else{
            this.globalKeyValueSelect = {'name': 'global', 'check': false}
            var files = []
            Object.keys(this.parent.containerFiles).forEach((file) => {
                var kvs = []
                Object.keys(this.parent.containerFiles[file].searchContainer).forEach((uid) => {
                    var keys = []
                    Object.keys(this.parent.containerFiles[file].searchContainer[uid].res.res_kv).forEach((key) => {
                        keys.push({'name': key, 'check': false})
                    })
                    kvs.push({'uid': uid, 'name': this.parent.containerFiles[file].searchContainer[uid].ins.desc.value, 'check': false, 'children': keys})
                })
                files.push({'uid': file, 'name': file, 'check': false, 'children': kvs})
            })
            this.globalKeyValueSelect['children'] = files
        }
        this.globalKeyValueTree = new TreeSelect(this.globalKeyValueSelect, this, this.parent.tabcontents)
    }

    openGlobalKeyValueTree(){
        if (this.globalKeyValueTree != '') {
            this.globalKeyValueTree.delete()
        }
        this.generateGlobalKeyValueTree()
        this.globalKeyValueTree.open()
    }

    closeGlobalKeyValueTree(){
        this.globalKeyValueTree.close()
    }

    async applyKeyValueTree(){
        let that = this

        await service.get(urls.global_sort, {
            params: {
                globalKeyValueSelect: JSON.stringify(that.globalKeyValueSelect)
            },
            })
            .then(response => {
                that.globalSequentialChart = new SequentialChart(JSON.parse(response.data.content), this.parent.tabcontents)
                that.closeGlobalKeyValueTree()
                that.openGlobalSequentialChart()
            })
    }

    openGlobalSequentialChart(){
        this.globalSequentialChart.open()
    }

    closeGlobalSequentialChart(){
        this.globalSequentialChart.close()
    }
}

class FileViewer
{
    constructor(parent, file){
        this.parent = parent
        this.uid = ''
        this.file = file
        this.name = ''
        this.configPath = ''
        this.configContent = {'search': []}
        this.lines = []
        this.words = []
        this.searchContainer = {}
        this.originArea = ''
        this.searchArea = ''
        this.tabcontent = ''
        this.keyValueSelect = {}
        this.highlightSelect = {}
        this.tmpSearch = ''

        this.keyValueTree = ''
        this.highlightTree = ''
        this.sequentialChart = ''

        this.openFile()
    }

    async openFile(){
        let that = this

        var start = new Date()
        await service.emit('new', this.file.filePaths[0], (res) => {
            var response = res
            that.uid = response.uid
            that.name = response.filename
            that.lines = response.lines
            that.words = response.words
            that.parent.containerFiles[that.uid] = that
            that.init()
            var end   = new Date()
            console.log((end.getTime() - start.getTime()) / 1000)
            document.getElementById(that.uid+'-tablink').click()
        })
        // await service.get(urls.new, {
        //     params: {
        //         path: that.file.filePaths[0],
        //         point: 0,
        //         range: 50
        //     },
        //     })
        //     .then(
        //     (response)=>{
        //         var end   = new Date()
        //         console.log((end.getTime() - start.getTime()) / 1000)
        //         console.log(response)
        //         that.uid = response.data.uid
        //         that.name = response.data.filename
        //         that.lines = response.data.lines
        //         that.words = response.data.words
        //         that.parent.containerFiles[that.uid] = that
        //         that.init()
        //         end   = new Date()
        //         console.log((end.getTime() - start.getTime()) / 1000)
        //         document.getElementById(that.name+'-tablink').click()
        //     }, (error) => {
        //         alert("Log File Format ERROR or Not Support Currently!", error)
        //     })
    }

    init(){
        let that = this
        var tablink = document.createElement('button')
        tablink.setAttribute('id', this.uid+'-tablink')
        tablink.style.backgroundColor = '#555'
        tablink.style.color = 'white'
        // tablink.style.float = 'left'
        tablink.style.border = 'none'
        tablink.style.cursor = 'pointer'
        tablink.style.padding = '5px 8px'
        tablink.style.fontSize = '15px'
        tablink.style.width = '15%'
        tablink.className = "tablink"
        tablink.innerHTML = this.name

        tablink.addEventListener('click', function()
        {
            that.parent.openPage(that.uid+'-tabcontent', tablink)
        })
    
        this.tabcontent = document.createElement('div')
        this.tabcontent.setAttribute('id', this.uid+'-tabcontent')
        this.tabcontent.style.display = 'none'
        this.tabcontent.style.color = 'white'
        this.tabcontent.className = "tabcontent"
    
        this.originArea = document.createElement('div')
        this.originArea.setAttribute('id', this.uid+'-tabcontent-origin')
        this.originArea.style.width = '100%'
        this.originArea.style.overflowY = 'hidden'
        // this.originArea.style.overflow = 'auto'
        this.originArea.style.border = '2px solid #ddd'
        this.originArea.style.height = `${document.body.offsetHeight - 50}px`

        const table = new LazyLogTable(this.uid, this.originArea, this.lines)

        this.searchArea = document.createElement('div')
        this.searchArea.setAttribute('id', this.uid+'-tabcontent-search')

        this.tabcontent.append(this.originArea)
        this.tabcontent.append(this.searchArea)
        this.parent.tablinks.append(tablink)
        this.parent.tabcontents.append(this.tabcontent)
    }

    saveConfig(){
        this.configContent = {'search': []}
        Object.keys(this.searchContainer).forEach((uid) => {
            var ins = this.searchContainer[uid].ins
            this.configContent['search'].push({'desc': ins.desc.value, 'search': ins.expSearch.value, 'regexs': ins.getRegexList(), 'highlights': ins.getHighlightList()})
        })
        return this.configContent
    }

    loadConfig(content){
        this.searchContainer = {}
        this.configPath = content[0]
        this.configContent = JSON.parse(content[1])
        this.configContent['search'].forEach((search) => {
            this.tmpSearch = new SearchAtom(this, this.tabcontent)
            this.tmpSearch.desc.value = search.desc
            this.tmpSearch.expSearch.value = search.search
            search.regexs.forEach((regex) => {
                this.tmpSearch.expRegex.value = regex
                this.tmpSearch.addRegexItem()
            })
            search.highlights.forEach((highlight) => {
                this.tmpSearch.highlight.value = highlight[0]
                this.tmpSearch.color.value = highlight[1]
                this.tmpSearch.addHighlightItem()
            })
            this.tmpSearch.search()
        })
    }

    scrollOriginJump(index){
        this.originArea.querySelectorAll(`[id=origin-line${index}]`)[0].scrollIntoView(true)
    }

    // scrollSearchJump(line){

    // }

    newSearch(){
        this.tmpSearch = new SearchAtom(this, this.tabcontent)
        this.tmpSearch.open()
    }

    openSearch(uid){
        this.searchContainer[uid].ins.open()
    }

    updateSearch(searchAtom){
        this.searchContainer[searchAtom.uid].res = searchAtom.res
    }

    addSearch(searchAtom){
        this.searchContainer[searchAtom.uid] = {'ins': searchAtom, 'res': searchAtom.res}
        console.log(searchAtom.res)
        this.originArea.style.height = `${parseInt(parseInt(document.body.offsetHeight - 50) / 2)}px`
        this.searchArea.style.width = '100%'
        this.searchArea.style.overflow = 'auto'
        this.searchArea.style.border = '2px solid #ddd'
        this.searchArea.style.height = `${parseInt(parseInt(document.body.offsetHeight - 50) / 2)}px`
        if (this.keyValueTree != ''){
            this.keyValueTree.delete()
            this.keyValueTree = ''
        }
    }

    shutAllSearch(){
        var coll = this.searchArea.querySelectorAll(".content")
        for (var i = 0; i < coll.length; i++) {
            coll[i].style.display = "none"
        }
    }

    generateKeyValueTree(){
        if ('children' in this.keyValueSelect) {
            var ownChild = []
            this.keyValueSelect['children'].forEach((child) => {
                ownChild.push(child.uid)
            })
            Object.keys(this.searchContainer).forEach((uid) => {
                if (!ownChild.includes(uid)) {
                    var keys = []
                    Object.keys(this.searchContainer[uid].res.res_kv).forEach((key) => {
                        keys.push({'name': key, 'check': false})
                    })
                    this.keyValueSelect['children'].push({'uid': uid, 'name': this.searchContainer[uid].ins.desc.value, 'check': false, 'children': keys})
                }
            })
        }else{
            this.keyValueSelect = {'name': this.name, 'check': false}
            var kvs = []
            console.log(this.searchContainer)
            Object.keys(this.searchContainer).forEach((uid) => {
                var keys = []
                Object.keys(this.searchContainer[uid].res.res_kv).forEach((key) => {
                    keys.push({'name': key, 'check': false})
                })
                kvs.push({'uid': uid, 'name': this.searchContainer[uid].ins.desc.value, 'check': false, 'children': keys})
            })
            this.keyValueSelect['children'] = kvs
        }
        this.keyValueTree = new TreeSelect(this.keyValueSelect, this, this.tabcontent)
    }

    async applyKeyValueTree(){
        let that = this

        await service.get(urls.sort, {
            params: {
                filename: that.name,
                keyValueSelect: JSON.stringify(that.keyValueSelect)
            },
            })
            .then(response => {
                that.sequentialChart = new SequentialChart(JSON.parse(response.data.content), this.tabcontent)
                that.closeKeyValueTree()
                that.openSequentialChart()
                that.configContent['select'] = that.keyValueSelect
            })
    }

    openKeyValueTree(){
        if (this.keyValueTree == '') {
            this.generateKeyValueTree()
        }
        this.keyValueTree.open()
    }

    closeKeyValueTree(){
        this.keyValueTree.close()
    }

    openSequentialChart(){
        this.sequentialChart.open()
    }

    closeSequentialChart(){
        this.sequentialChart.close()
    }

    generateHighlightTree(){

    }

    close(){
        document.getElementById(this.name+'-tablink').remove()
        document.getElementById(this.name+'-tabcontent').remove()
    }

}

class Dialog
{
    constructor(){
        this.modal = ''
        this.container = ''
        this.dialogInit()
    }

    dialogInit(){
        this.modal = document.createElement('div')
        this.modal.className = 'modal'

        this.container = document.createElement('div')
        this.container.style.backgroundColor = '#555'
        this.container.className = 'container'

        this.modal.appendChild(this.container)
    }

    open(){
        this.modal.style.display = "block"
    }

    close(){
        this.modal.style.display = "none"
    }
}

class SearchDialog extends Dialog
{
    constructor(){
        super()
        // this.dialogInit()
        this.desc = ''
        this.expSearch = ''
        this.expRegex = ''
        this.highlight = ''
        this.color = ''
        this.regexUl = ''
        this.highlightUl = ''
        this.searchDialogInit()
    }

    searchDialogInit(){
        let that = this

        // search description
        var descL = document.createElement('label')
        descL.innerHTML = 'Search Description'
        this.desc = document.createElement('input')
        this.desc.type = 'text'

        // search express 
        var expSearchL = document.createElement('label')
        expSearchL.innerHTML = 'Search Express'
        this.expSearch = document.createElement('input')
        this.expSearch.type = 'text'

        // regex express
        var expRegexL = document.createElement('label')
        expRegexL.innerHTML = 'Key Value Extract Regex Express'
        this.expRegex = document.createElement('input')
        this.expRegex.style.width = '85%'
        this.expRegex.type = 'text'
        var addRegex = document.createElement('button')
        addRegex.style.width = '15%'
        addRegex.innerHTML = 'ADD'
        addRegex.onclick = function(){that.addRegexItem()}
        this.regexUl = document.createElement('ul')

        // highlight items
        var highlightL = document.createElement('label')
        highlightL.innerHTML = 'Highlight Word(comma separation between words)'
        this.highlight = document.createElement('input')
        this.highlight.style.width = '75%'
        this.highlight.type = 'text'
        this.color = document.createElement('input')
        this.color.type = 'color'
        var addHighlight = document.createElement('button')
        addHighlight.style.width = '15%'
        addHighlight.innerHTML = 'ADD'
        addHighlight.onclick = function(){that.addHighlightItem()}
        this.highlightUl = document.createElement('ul')

        // search and cancel button
        var apply = document.createElement('button')
        apply.innerHTML = 'SEARCH'
        apply.onclick = function(){that.search()}
        var cancel = document.createElement('button')
        cancel.style.backgroundColor = 'red'
        cancel.innerHTML = 'CANCEL'
        cancel.onclick = function(){that.close()}

        this.container.appendChild(descL)
        this.container.appendChild(this.desc)
        this.container.appendChild(expSearchL)
        this.container.appendChild(this.expSearch)

        this.container.appendChild(expRegexL)
        this.container.appendChild(this.expRegex)
        this.container.appendChild(addRegex)
        this.container.appendChild(this.regexUl)

        this.container.appendChild(highlightL)
        this.container.appendChild(this.highlight)
        this.container.appendChild(this.color)
        this.container.appendChild(addHighlight)
        this.container.appendChild(this.highlightUl)

        this.container.appendChild(apply)
        this.container.appendChild(cancel)
        this.modal.appendChild(this.container)
    }

    async search(){
    }

    addRegexItem(){
        let that = this
        var li = document.createElement("li")
        // li.style.listStyleType = 'none'

        var t = document.createElement("input");
        t.setAttribute('type', "text")
        t.setAttribute('value', this.expRegex.value)
        t.style.width = '92%'
        var x = document.createElement("button")
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.innerHTML = 'X'
        x.onclick = function(){that.deleteItem(x)}

        li.appendChild(t)
        li.appendChild(x)
        this.regexUl.append(li)
    }

    addHighlightItem(){
        let that = this
        var li = document.createElement("li")
        // li.style.listStyleType = 'none'

        var t = document.createElement("input");
        t.setAttribute('type', "text")
        t.setAttribute('value', this.highlight.value)
        t.style.width = '82%'
        var c = document.createElement("input")
        c.setAttribute('type', "color")
        c.setAttribute('value', this.color.value)
        var x = document.createElement("button")
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.onclick = function(){that.deleteItem(x)}
        x.innerHTML = 'X'

        li.appendChild(t)
        li.appendChild(c)
        li.appendChild(x)
        this.highlightUl.append(li)
    }

    deleteItem(b){
        common.removeAll(b.parentNode)
    }
}

class SearchAtom extends SearchDialog
{
    constructor(parent, position){
        super()
        this.register(position)
        this.parent = parent
        this.uid = ''
        this.res = {}
        this.select = {}
        this.resButton = ''
        this.resTable = ''
        // this.desc.value = "search test"
        // this.expSearch.value = "txlProcBranchE & (pmb | txAtt)"
        // this.expRegex.value = "%{STRING:device}: \\[%{TIMESTAMP:time}\\] \\(%{STRING:cost}\\) %{STRING:name} %{STRING:trace}: %{DROP:tmp}txAtt:%{INT:txAtt}, txAttPeak:%{INT:txAttPeak},%{DROP:tmp}torTemperature:%{INT:torTemperature} "
    }

    register(position){
        position.append(this.modal)
    }

    async search(){
        let that = this
        await service.get(urls.search, {
        params: {
            file_uid: that.parent.uid,
            search_uid: that.uid,
            desc: that.desc.value,
            exp_search: that.expSearch.value,
            exp_regex: that.getRegexList(),
            highlights: JSON.stringify(that.getHighlightList())
        },
        })
        .then(function (response) {
            that.res = response.data.content
            if (that.uid == ''){
                that.uid = response.data.uid

                that.resButton = document.createElement('div')

                var del = document.createElement('button')
                del.style.backgroundColor = '#777'
                del.style.width = '2%'
                del.style.border = '1px solid #ddd'
                del.style.color = 'white'
                del.style.cursor = 'pointer'
                del.fontSize = '15px'
                del.innerHTML = 'X'

                var search = document.createElement('button')
                search.style.backgroundColor = '#777'
                search.style.width = '2%'
                search.style.border = '1px solid #ddd'
                search.style.color = 'white'
                search.style.cursor = 'pointer'
                search.fontSize = '15px'
                search.innerHTML = 'O'

                var collapsible = document.createElement('button')
                collapsible.style.backgroundColor = '#777'
                collapsible.style.width = '96%'
                collapsible.style.border = '1px solid #ddd'
                collapsible.style.textAlign = 'left'
                collapsible.style.color = 'white'
                collapsible.style.cursor = 'pointer'
                collapsible.fontSize = '15px'
                collapsible.className = 'collapsible'
                collapsible.innerHTML = '+ ' + that.desc.value + ` (${that.res.res_search_lines.length} hits)`
                that.resButton.append(del)
                that.resButton.append(search)
                that.resButton.append(collapsible)
        
                that.resTable = document.createElement('div')
                that.resTable.style.width = '100%'
 
                const table = new LazyLogTable(that.resTable, that.res.res_search_lines)
                // that.res.res_search_lines.forEach((line) => {
                //     var tr = that.addLine(line)
                //     tr.addEventListener('dblclick', function()
                //     {
                //         that.parent.scrollOriginJump(parseInt(this.getAttribute('line')))
                //     })
                //     tr.setAttribute('line', line)
                //     that.resTable.appendChild(tr)
                // })

                that.parent.shutAllSearch()
                that.parent.searchArea.append(that.resButton)
                that.parent.searchArea.append(that.resTable)
        
                // bind button click event
                del.addEventListener("click", function() {
                    common.removeAll(that.resTable)
                    common.removeAll(that.resButton)
                })

                search.addEventListener("click", function() {
                    that.open()
                })

                collapsible.addEventListener("click", function() {
                    if (that.resTable.style.display === "block") {
                        that.resTable.style.display = "none"
                    } else {
                        that.resTable.style.display = "block"
                    }
                })
                that.parent.addSearch(that)
            }
            else{
                //removeAllChild
                common.removeAllChild(that.resTable)
                that.res.res_search_lines.forEach((line) => {
                    that.resTable.appendChild(that.addLine(line))
                })
                that.parent.shutAllSearch()
                that.resTable.style.display = "block"
                that.resButton.lastChild.innerHTML = '+ ' + that.desc.value + ` (${that.res.res_search_lines.length} hits)`
                that.parent.updateSearch(that)
            }
            that.close()
        })
        .catch(function (error) {
        // handle error
            console.log(error);
        })
    }

    getRegexList(){
        var regexs = []
        for (const li of this.regexUl.children) {
            for (const elm of li.children) {
                if (elm.tagName == 'INPUT'){
                    regexs.push(elm.value)
                }
            }
        }
        return regexs
    }

    getHighlightList(){
        var highlights = []
        for (const li of this.highlightUl.children) {
            var item = []
            for (const elm of li.children) {
                if (elm.tagName == 'INPUT'){
                    item.push(elm.value)
                }
            }
            highlights.push(item)
        }
        return highlights
    }

    addLine(line){
        var tr = document.createElement('tr')
        var td = document.createElement('td')
        td.style.color = '#FFF'
        td.style.whiteSpace = 'nowrap'
        td.style.textAlign = 'left'
        td.style.fontSize = '12px'
        td.innerText = this.parent.lines[line]
        tr.appendChild(td)

        tr.addEventListener('click', function()
        {
            var lineActive = document.getElementsByClassName("line-active")
            for (var i = 0; i < lineActive.length; i++) {
                lineActive[i].style.backgroundColor = "#000"
            }
            tr.style.backgroundColor = '#000099'
            tr.className = 'line-active'
        })
        return tr
    }
}

class svg
{
    constructor(){
        this.canvas = ''
        this.svg = ''
        this.svgInit(0.5, 3)
    }

    svgInit(scaleMin, scaleMax){
        this.canvas = document.createElement('div')
        this.canvas.style.display = "none"
        this.canvas.style.width = '100%'
        this.canvas.style.height = `${document.body.offsetHeight - 100}px`
        this.canvas.style.position = 'fixed'
        this.canvas.style.zIndex = 0
        this.canvas.style.left = 0
        this.canvas.style.top = 0
        this.canvas.style.marginTop = '50px'

        var content = document.createElement('div')
        content.style.width = "100%"
        content.style.height = `${document.body.offsetHeight - 100}px`
        content.style.position = "relative"
        content.style.backgroundColor = '#555'
        content.style.border = '1px solid #888'

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', document.body.offsetHeight - 100)
        content.append(svg)
        this.canvas.append(content)

        var zoom = d3.zoom().scaleExtent([scaleMin, scaleMax]).on("zoom", zoomed)
        d3.select(svg).call(zoom).on("dblclick.zoom", null)

        this.svg = d3.select(svg).append("g")
                    .attr("id", "canvas")
                    .style("font", "8px sans-serif")
                    .append("g")
                        .attr("transform", `translate(${document.body.offsetWidth / 4},${document.body.offsetHeight / 2})`)
    
        function zoomed(event) {
            const {transform} = event
            d3.select(svg).select("#canvas").attr("transform", transform)
        }
    }

    open(){
        this.canvas.style.display = "block"
    }

    close(that){
        if(that){
            that.canvas.style.display = "none"
        }else{
            this.canvas.style.display = "none"
        }
    }

    delete(){
        common.removeAll(this.canvas)
    }
}

class TreeSelect extends svg
{
    constructor(data, parent, position){
        super()
        this.register(position)
        this.parent = parent
        this.data = data
        this.draw(this.data, this.svg)
        this.addButton('APPLY', this.apply)
        this.addButton('CANCEL', this.close)
    }

    register(position){
        position.append(this.canvas)
    }

    draw(data, svg){
        // let that = this
        const width = 1600
        const dx = 10
        const dy = width / 6
        const margin = ({top: 10, right: 120, bottom: 10, left: 40})
  
        const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)
        const root = d3.hierarchy(data);
        const tree = d3.tree().nodeSize([dx, dy])
        
        root.x0 = dy / 2;
        root.y0 = 0;
        
        // root.descendants().forEach((d, i) => {
            // d._children = d.children
            // if (d.depth !== 0) d.children = null
        // })
      
        const gLink = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5);
      
        const gNode = svg.append("g")
            .attr("cursor", "pointer")
            .attr("pointer-events", "all");
      
        function update(source) {
          // const duration = d3.event && d3.event.altKey ? 2500 : 250;
          const duration = 250;
          const nodes = root.descendants().reverse();
          const links = root.links();
          // Compute the new tree layout.
          tree(root);
          
          let left = root;
          let right = root;
          root.eachBefore(node => {
            if (node.x < left.x) left = node;
            if (node.x > right.x) right = node;
          });
      
          const height = right.x - left.x + margin.top + margin.bottom;
      
          const transition = svg.transition()
              .duration(duration)
              .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
              .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));
      
          // Update the nodes…
          const node = gNode.selectAll("g")
            .data(nodes, d => d.id);
      
          // Enter any new nodes at the parent's previous position.
          const nodeEnter = node.enter().append("g")
              .attr("transform", `translate(${source.y0},${source.x0})`)
            //   .attr("transform", d => `translate(${source.y0},${source.x0})`)
              .attr("fill-opacity", 0)
              .attr("stroke-opacity", 0)
              .on("click", (event, d) => {
                d.children = d.children ? null : d._children;

                if (d._children) {
                    return
                }else{
                  if (d.data.check == true){
                    d.data.check = false
                    d3.select(event.target.parentNode).select('circle').attr("fill", "#999")
                    d3.select(event.target.parentNode).select('text').attr("fill", "#FFF")
                    d3.select(event.target.parentNode).select('text').attr("stroke", "#FFF")
                  }else{
                    d.data.check = true
                    d3.select(event.target.parentNode).select('circle').attr("fill", "#33CC00")
                    d3.select(event.target.parentNode).select('text').attr("fill", "#33CC00")
                    d3.select(event.target.parentNode).select('text').attr("stroke", "#33CC00")
                  }
                }
                // update(d);
                // console.log(select)
              });
      
          nodeEnter.append("circle")
              .attr("r", 2.5)
              .attr("id", d => "circle"+String(d.data.id))
              .attr("fill", d => {
                    if (d.data.check == true){
                        return "#33CC00"
                    }
                    if (d._children){
                        return "555"
                    }else{
                        return "#999"
                    }
                })
              .attr("stroke-width", 10);
      
          nodeEnter.append("text")
              .attr("id", d => "text"+String(d.data.id))
              .attr("dy", "0.31em")
              .attr("x", d => d._children ? -6 : 6)
              .attr("text-anchor", d => d._children ? "end" : "start")
              .text(d => d.data.name)
              .attr("stroke-width", 0.5)
              .attr("stroke", d => {
                    if (d.data.check == true){
                        return "#33CC00"
                    }else{
                        return "white"
                    }
                })
              .attr("fill", d => {
                    if (d.data.check == true){
                        return "#33CC00"
                    }else{
                        return "white"
                    }
                });
      
          // Transition nodes to their new position.
          node.merge(nodeEnter).transition(transition)
              .attr("transform", d => `translate(${d.y},${d.x})`)
              .attr("fill-opacity", 1)
              .attr("stroke-opacity", 1);
      
          // Transition exiting nodes to the parent's new position.
          node.exit().transition(transition).remove()
              .attr("transform", `translate(${source.y},${source.x})`)
              .attr("fill-opacity", 0)
              .attr("stroke-opacity", 0);
      
          // Update the links…
          const link = gLink.selectAll("path")
            .data(links, d => d.target.id);
      
          // Enter any new links at the parent's previous position.
          const linkEnter = link.enter().append("path")
              .attr("d", function () {
                const o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
              });
      
          // Transition links to their new position.
          link.merge(linkEnter).transition(transition)
              .attr("d", diagonal);
      
          // Transition exiting nodes to the parent's new position.
          link.exit().transition(transition).remove()
              .attr("d", function () {
                const o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
              });
      
          // Stash the old positions for transition.
          root.eachBefore(d => {
            d.x0 = d.x;
            d.y0 = d.y;
          });
        }
        update(root);
        // this.syncTreeAndFilterData(svg, filterData)
    }

    addButton(name, func){
        let that = this
        var button = document.createElement('button')
        button.innerHTML = name
        button.addEventListener('click', function()
        {
            func(that)
        })
        this.canvas.appendChild(button)
    }

    apply(that){
        that.parent.applyKeyValueTree()
    }

}

class Chart
{
    constructor(){
        this.canvas = ''
        this.chart = ''
        this.chartInit()
    }

    chartInit(){
        this.canvas = document.createElement('div')
        this.canvas.style.display = "none"
        this.canvas.style.width = '100%'
        this.canvas.style.height = `${document.body.offsetHeight - 100}px`
        this.canvas.style.position = 'fixed'
        this.canvas.style.zIndex = 0
        this.canvas.style.left = 0
        this.canvas.style.top = 0
        this.canvas.style.marginTop = '50px'

        var content = document.createElement('div')
        content.style.width = "100%"
        content.style.height = `${document.body.offsetHeight - 100}px`
        content.style.position = "relative"
        content.style.backgroundColor = '#555'
        content.style.border = '1px solid #888'

        var chart = document.createElement("div")
        chart.setAttribute('style', `width:${document.body.offsetWidth}px;height:${document.body.offsetHeight - 100}px;`)
        content.append(chart)
        this.canvas.append(content)

        var screen = document.getElementById('screen')
        screen.append(this.canvas)

        this.chart = echarts.init(chart, 'dark')
    }

    getSequentialChartConfig(){
        return {
          title: {
            text: 'Stacked Line'
          },
          // backgroundColor:'#3F3F3F',
          toolbox:{
            feature:{
            }
          },
          tooltip: {
            trigger: 'axis',
            show: true,
            axisPointer:{
              axis: 'x'
            },
            // layout: 'vertical',
            formatter: (params) => {
              var ret = ''
              params.forEach((param) => {
                if(param['seriesName'] != 'highlight'){
                  ret = ret + param.marker + param.seriesName +"  value:" + param.data['origin'] + '<br/>'
                }
              })
              return ret;
              
            },
          },
          legend: {
            data: [],
            itemWidth:12,
            itemHeight:12,
            left:'20%',
            // type: 'scroll',
            // orient: "vertical",
            textStyle: {
              fontSize: '10',
            },
          },
          xAxis: {
            // type: 'category',
            axisLabel: {
              textStyle:{
                fontSize: "10"
              },
            },
            data: []
          },
          yAxis: {
            axisLabel: {
              textStyle:{
                fontSize: "10"
              },
            }
          },
          dataZoom: [
            {
              type: 'inside',
              throttle: 50,
              start: 0,
              end: 100
            },
            {
              start: 0,
              end: 20
            }
          ],
          series: []
        }
    }

    open(){
        this.canvas.style.display = "block"
    }

    close(that){
        that.canvas.style.display = "none"
    }
}

class SequentialChart extends Chart
{
    constructor(selectedLine, position){
        super()
        this.register(position)
        this.selectedLines = selectedLine
        this.draw()
        this.addButton('CANCEL', this.close)
    }

    register(position){
        position.append(this.canvas)
    }

    draw(){
        // let that = this
        console.log(this.selectedLines)
        // package line
        var option = this.getSequentialChartConfig()
        option['title']['text'] = "Sequential"
        option['yAxis'] = []
        option['series'] = []
        var yAxisIndex = 0
        var legend = []
        var leftYAxis = []
        var rightYAxis = []

        if (Object.keys(this.selectedLines).length == 0) {
            option['yAxis'] = [{'type':'value'}]
        }
        Object.keys(this.selectedLines).forEach((line, index) => {
            if (line.includes('.highlight.')) {
                // var makeLineAxis = []
                var markLine = {
                  silent: true, // mouse move no event
                  symbol: 'none',
                  label:{
                    // color:'#FFFFFF',
                    fontSize:12,
                  },
                  lineStyle:{
                    type:'dotted',
                    width: 2
                  },
                  data:[]
                }
                this.selectedLines[line].forEach((item) => {
                    markLine['data'].push({'xAxis': parseInt(item.graph_index), 'label': {'color': item.value, 'formatter':line.split('.')[line.split('.').length - 1], 'fontSize':10}})
                    // makeLineAxis.push({'value':parseInt(item.graph_index)})
                })
        
                legend.push(line)
                option['series'].push(
                  {
                    name: line,
                    type: 'line',
                    showSymbol: false,
                    // data: makeLineAxis,
                    markLine: markLine
                  }
                )
            }else{
                var d = []
            
                if (this.selectedLines[line][0].type == 'STRING'){
                    var values = []
                    this.selectedLines[line].forEach((item) => {
                        values.push(item.value)
                    })
                    var categories = common.arrayDuplicates(values)
                }
                // config yaxis
                var offsetNum = 0
                if (index % 2 == 0) {
                    leftYAxis.push('left')
                    offsetNum = leftYAxis.length - 1
                }else{
                    rightYAxis.push('right')
                    offsetNum = rightYAxis.length - 1
                }
                option['yAxis'].push({
                    axisLabel: {
                        textStyle:{
                        fontSize: "8"
                        },
                    },
                    type: this.selectedLines[line][0].type == 'STRING' ? 'category' : 'value',
                    name: line,
                    nameTextStyle: {
                        fontSize:'7',
                        padding:[0, 0, -7 * offsetNum, 0],
                    },
                    position: index % 2 == 0 ? 'left' : 'right', // left or right
                    offset: 30 * offsetNum,
                    data: this.selectedLines[line][0].type == 'STRING' ? categories : null
                })
    
                // package xaxis data
                this.selectedLines[line].forEach((item) => {
                    d.push({'value': [item.graph_index, item.value], 'origin':item.value, 'timestamp':item.timestamp})
                })
                
                option['series'].push(
                {
                    name: line,
                    type: 'line',
                    yAxisIndex: yAxisIndex,
                    showSymbol: false,
                    data: d,
                }
                )
                yAxisIndex = yAxisIndex + 1
                legend.push(line)
            }
        })
  
        option['tooltip']['formatter'] = function(params){
            var ret = ''
            params.forEach((param) => {
                ret = ret + param.marker + param.data.timestamp +'<br/>'+ "&nbsp;&nbsp;&nbsp;&nbsp;" + param.seriesName + ":" + param.data.origin + '<br/>'
            })
            return ret;
        }
        
        // bind click event and paint
        option['legend']['data'] = legend
        option['xAxis']['type'] = 'value'
        // install tool button 
        // option['toolbox']['feature'] = {
        //   myTool1:{
        //     show:true,
        //     title: 'Zoom Out',
        //     icon: 'path://M395.731085 571.196755l10.18176 10.18176q4.072704 4.072704 8.145408 7.63632t8.145408 7.63632l12.218112 12.218112q20.363521 20.363521 16.290817 35.636161t-25.454401 35.636161q-9.163584 10.18176-30.036193 31.054369t-44.799745 45.308833-46.32701 46.836098-34.617985 35.636161q-18.327169 18.327169-25.454401 32.072545t6.109056 26.981665q9.163584 9.163584 23.418049 24.436225t24.436225 25.454401q17.308993 17.308993 12.7272 30.545281t-30.036193 15.27264q-26.472577 3.054528-59.05421 7.127232t-67.199618 7.63632-67.708706 7.63632-60.581474 7.127232q-26.472577 3.054528-36.654337-6.618144t-8.145408-34.108897q2.036352-25.454401 5.599968-57.017858t7.63632-64.654178 7.63632-65.672354 6.618144-60.072386q3.054528-29.527105 16.799905-37.672513t31.054369 9.163584q10.18176 10.18176 26.472577 24.945313t27.490753 25.963489 21.381697 7.127232 23.418049-16.290817q13.236288-13.236288 36.145249-36.654337t47.854274-48.363362 48.363362-48.87245 37.672513-38.181601q6.109056-6.109056 13.745376-11.709024t16.799905-7.63632 18.836257 1.018176 20.872609 13.236288zM910.928158 58.036034q26.472577-3.054528 36.654337 6.618144t8.145408 34.108897q-2.036352 25.454401-5.599968 57.017858t-7.63632 64.654178-7.63632 66.181442-6.618144 60.581474q-3.054528 29.527105-16.799905 37.163425t-31.054369-9.672672q-10.18176-10.18176-27.999841-26.472577t-29.018017-27.490753-19.345345-9.672672-20.363521 13.745376q-14.254464 14.254464-37.163425 37.672513t-48.363362 49.381538-49.890626 50.399714l-37.672513 37.672513q-6.109056 6.109056-13.236288 12.218112t-15.781729 9.163584-18.327169 1.018176-19.854433-13.236288l-38.690689-38.690689q-20.363521-20.363521-17.818081-37.163425t22.908961-37.163425q9.163584-9.163584 30.545281-31.054369t45.817921-46.32701 47.345186-47.854274 36.145249-35.636161q18.327169-18.327169 22.908961-30.036193t-8.654496-24.945313q-9.163584-9.163584-21.890785-22.399873t-22.908961-23.418049q-17.308993-17.308993-12.7272-30.545281t30.036193-16.290817 58.545122-7.127232 67.708706-7.63632 67.708706-7.63632 60.581474-7.127232z',
        //     onclick: (e) =>{
        //       if(that.isGraphFullScreen == false){
        //         document.getElementById("log-detail-standard-zoom-btn").style.display = "none"
        //         document.getElementById("Sequential").setAttribute('style', `width:${document.body.offsetWidth}px;height:${that.graphHeight}px;`)
        //         chart.resize({height:that.graphHeight, width:document.body.offsetWidth})
                
        //         that.isGraphFullScreen = true
        //         document.getElementById("graph-detail-standard").style.left = "0%"
        //         document.getElementById("graph-detail-standard").style.width = "100%"
        //       }else{
        //         document.getElementById("log-detail-standard-zoom-btn").style.display = "block"
        //         document.getElementById("Sequential").setAttribute('style', `width:${document.body.offsetWidth / 2}px;height:${that.graphHeight}px;`)
        //         chart.resize({height:that.graphHeight, width:document.body.offsetWidth / 2})
   
        //         that.isGraphFullScreen = false
        //         document.getElementById("graph-detail-standard").style.left = "50%"
        //         document.getElementById("graph-detail-standard").style.width = "50%"
        //         document.getElementById("log-detail-standard").style.width = "50%"
        //       }
  
        //     }
        //   },
        //   myTool2:{
        //     show:true,
        //     title: 'Edit',
        //     icon: 'path://M499.2 281.6l243.2 243.2L413.866667 853.333333H170.666667v-243.2l328.533333-328.533333z m0 123.733333L256 648.533333V768h119.466667l243.2-243.2-119.466667-119.466667zM614.4 170.666667L853.333333 413.866667l-72.533333 72.533333-243.2-243.2L614.4 170.666667z',
        //     onclick: (e) =>{
        //       var modal = document.getElementById("legend-config-modal")
        //       modal.style.display = "block"
        //     }
        //   },
        //   myTool3:{
        //     show:true,
        //     title: 'Export',
        //     icon: 'path://M712.533333 371.2l-128 128-59.733333-59.733333 128-128L597.333333 256l-42.666666-42.666667h256v256l-42.666667-42.666666-55.466667-55.466667zM657.066667 256H768v110.933333V256h-110.933333zM298.666667 298.666667v426.666666h426.666666v-256l85.333334 85.333334v256H213.333333V213.333333h256l85.333334 85.333334H298.666667z',
        //     onclick: (e) =>{
        //       that.exportExcel()
        //     }
        //   },
  
        // }
        this.chart.setOption(option)
        this.chart.on('click', function(params) {
          if(params['componentType'] != 'markLine'){
            // that.numLine = params.data.processIndex
            // that.process = params.seriesName.split('.')[0]
            // that.$common.removeAllChildDom('content-standard')
            // that.graphLogData = that.originLogs[that.process]
            // that.openLogDetail(that.numLine, false)
            // that.openSnackbar()
          }
        });
        // this.chart.on('legendselectchanged', function(params){
        // //   that.selectedLinesOnGraph = params.selected
        // });
    }

    addButton(name, func){
        let that = this
        var button = document.createElement('button')
        button.innerHTML = name
        button.addEventListener('click', function()
        {
            func(that)
        })
        this.canvas.appendChild(button)
    }
}

class LazyLogTable
{
    constructor(uid, position, lines){
        this.uid = uid
        this.table = ''
        this.slider = ''
        this.fontSize = 12

        this.lines = lines
        this.range = 100
        this.init(position)
    }

    init(position){
        let that = this
        var div = document.createElement('div')
        div.style.float = 'left'
        div.style.width = '98%'

        this.table = document.createElement('table')
        
        this.slider = document.createElement('input')
        this.slider.className = 'slider'
        this.slider.style.float = 'left'
        this.slider.type = 'range'
        this.slider.min = 0
        this.slider.max = this.lines.length - this.range + parseInt((document.body.offsetHeight - 50) / this.fontSize)
        this.slider.style.width = '1%'
        this.slider.style.height = `${document.body.offsetHeight - 50}px`
        this.slider.value=0
        this.slider.step=1

        div.append(this.table)
        position.append(div)
        position.append(this.slider)

        this.slider.addEventListener('change', (event) => {
            that.refresh(parseInt(event.target.value))
        })

        position.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) - 1
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
            }
            that.refresh(parseInt(that.slider.value))
            e.preventDefault()
            e.stopPropagation()
        })

        this.refresh(0)
    }

    // refresh(value){
    //     common.removeAllChild(this.table)
    //     var start = value
    //     var end = start + this.range
    //     this.lines.slice(start, end).forEach((line) => {
    //         var tr = document.createElement('tr')
    //         var td = document.createElement('td')
    //         td.style.color = '#FFF'
    //         td.style.whiteSpace = 'nowrap'
    //         td.style.textAlign = 'left'
    //         td.style.fontSize = `${this.fontSize}px`
    //         td.innerText = line
    //         tr.appendChild(td)
    //         this.table.appendChild(tr)
    //     })
    // }

    refresh(point){
        let that = this
        service.emit('scroll', this.uid, point, this.range, (res) => {
            common.removeAllChild(this.table)
            that.lines = res.lines
            that.lines.forEach((line) => {
                var tr = document.createElement('tr')
                var td = document.createElement('td')
                td.style.color = '#FFF'
                td.style.whiteSpace = 'nowrap'
                td.style.textAlign = 'left'
                td.style.fontSize = `${that.fontSize}px`
                td.innerText = line
                tr.appendChild(td)
                that.table.appendChild(tr)
            })
        })
    }

}

export {TextLogicView}