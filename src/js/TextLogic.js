import urls from '@/plugins/urls'
import service from '@/plugins/socket'
import http from '@/plugins/http'
import common from '@/plugins/common'

import { ipcRenderer } from 'electron'
import { SearchDialog, ShareDownloadDialog } from './dialog'
import { SequentialChart } from './chart'
import { TreeSelect } from './svg'


class TextLogicView
{
    constructor(screen){
        this.containerFiles = {}
        this.screen = screen
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

        this.screen.append(this.tablinks)
        this.screen.append(this.tabcontents)
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
        if (this.activeFile == uid) {
            var uids = Object.keys(this.containerFiles)
            var index = uids.indexOf(uid)
            if((index == 0)&(uids.length == 1)){
                null
            }else if (index == 0){
                index = index + 1
                document.getElementById(uids[index]+'-tablink').click()
            }else{
                index = index - 1
                document.getElementById(uids[index]+'-tablink').click()
            }
        }
        this.containerFiles[uid].close()
        delete this.containerFiles[uid]
    }

}

class TopMenu
{
    constructor(parent){
        this.parent = parent
        this.globalKeyValueTree = ''
        this.globalKeyValueSelect = {}
        this.globalSequentialChart = ''
        this.shareDownload = ''

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
        ipcRenderer.on('save-theme', async function () {
            if (that.parent.containerFiles[that.parent.activeFile].configPath == ''){
                let file = await ipcRenderer.invoke('export-theme', JSON.stringify(that.parent.containerFiles[that.parent.activeFile].saveConfig()))
                that.parent.containerFiles[that.parent.activeFile].configPath = file.filePaths[0]
            }else{
                await ipcRenderer.invoke('save-theme', that.parent.containerFiles[that.parent.activeFile].configPath, JSON.stringify(that.parent.containerFiles[that.parent.activeFile].saveConfig()))
            }
        })
        ipcRenderer.on('export-theme', async () => {
            let file = await ipcRenderer.invoke('export-theme', JSON.stringify(that.parent.containerFiles[that.parent.activeFile].configContent))
            that.parent.containerFiles[that.parent.activeFile].saveConfig(file)
        })
        ipcRenderer.on('import-theme', async () => {
            let content = await ipcRenderer.invoke('import-theme')
            that.parent.containerFiles[that.parent.activeFile].loadConfig(content)
        })
        ipcRenderer.on('new-search', () => {
            that.newSearchDialog()
        })
        ipcRenderer.on('open-func-area', () => {
            that.openFunc('SEARCH')
        })
        ipcRenderer.on('open-global-keyvalue-tree', () => {
            that.openGlobalKeyValueTree()
        })
        ipcRenderer.on('open-global-chart', () => {
            that.openGlobalSequentialChart()
        })
        ipcRenderer.on('share-upload', async () => {
            let content = await ipcRenderer.invoke('import-theme')
            if(content[1] != ''){
                await http.get(urls.save_theme, {
                    params: {
                        filename: content[0],
                        theme: content[1]
                    },
                    })
                  .then(response => {
                        console.log(response.data)
                })
            }
        })
        ipcRenderer.on('share-download', async () => {
            // await ipcRenderer.invoke('downloadURL', {url:'http://localhost:8001/download_theme/config.txt'})
            that.openShareDownloadDialog()
        })
        ipcRenderer.on('test', async () => {
            await service.emit('test', {}, (res) => {
                console.log(res)
            })
        })
        ipcRenderer.on('shutdown_all', () => {
            service.emit('shutdown_all', {'shutdown':true}, (res) => {
                console.log(res)
            })
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
                        this.parent.containerFiles[file].searchContainer[uid].res.res_kv.forEach((key) => {
                            keys.push({'name': key, 'check': false})
                        })
                        kvs.push({'uid': uid, 'name': this.parent.containerFiles[file].searchContainer[uid].ins.desc.value, 'check': false, 'children': keys})
                    })
                    this.globalKeyValueSelect['children'].push({'uid': file, 'name': this.parent.containerFiles[file].name, 'check': false, 'children': kvs})
                }
            })
        }else{
            this.globalKeyValueSelect = {'name': 'global', 'check': false}
            var files = []
            Object.keys(this.parent.containerFiles).forEach((file) => {
                var kvs = []
                Object.keys(this.parent.containerFiles[file].searchContainer).forEach((uid) => {
                    var keys = []
                    this.parent.containerFiles[file].searchContainer[uid].res.res_kv.forEach((key) => {
                        keys.push({'name': key, 'check': false})
                    })
                    kvs.push({'uid': uid, 'name': this.parent.containerFiles[file].searchContainer[uid].ins.desc.value, 'check': false, 'children': keys})
                })
                files.push({'uid': file, 'name': this.parent.containerFiles[file].name, 'check': false, 'children': kvs})
            })
            this.globalKeyValueSelect['children'] = files
        }
        this.globalKeyValueTree = new TreeSelect(this.globalKeyValueSelect, this, this.parent.screen)
        this.globalKeyValueTree.canvas.style.position = 'fixed'
        this.globalKeyValueTree.canvas.style.zIndex = 0
        this.globalKeyValueTree.canvas.style.top = 0
        this.globalKeyValueTree.canvas.style.left = 0
        this.globalKeyValueTree.svg.attr("transform", `translate(${document.body.offsetWidth / 4},${document.body.offsetHeight / 2})`)
    }

    openGlobalKeyValueTree(){
        if (this.globalKeyValueTree != '') {
            this.globalKeyValueTree.delete()
        }            
        this.generateGlobalKeyValueTree()
        // this.globalKeyValueTree.open()
    }

    closeGlobalKeyValueTree(){
        this.globalKeyValueTree.close()
    }

    async applyKeyValueTree(){
        let that = this

        await service.emit('global_sort', {'global_key_value_select':this.globalKeyValueSelect}, (res) => {
                if (that.globalSequentialChart != '') {
                    that.globalSequentialChart.delete()
                }
                that.globalSequentialChart = new SequentialChart(res.content, that.parent.screen)
                that.globalSequentialChart.chart.resize({height:that.parent.screen.clientHeight - 120, width:that.parent.screen.clientWidth})
                that.globalSequentialChart.canvas.style.position = 'fixed'
                that.globalSequentialChart.canvas.style.zIndex = 0
                that.globalSequentialChart.canvas.style.top = 0
                that.globalSequentialChart.canvas.style.left = 0
                that.closeGlobalKeyValueTree()
            })
    }

    openGlobalSequentialChart(){
        if (this.globalSequentialChart != '') {
            this.globalSequentialChart.open()
        }
    }

    closeGlobalSequentialChart(){
        this.globalSequentialChart.close()
    }

    generateShareDownloadDialog(){
        this.shareDownload = new ShareDownloadDialog(this.parent.tabcontents)
    }

    openShareDownloadDialog(){
        if (this.shareDownload == '') {
            this.generateShareDownloadDialog()
        }
        this.shareDownload.open()
    }

    closeShareDownloadDialog(){
        this.shareDownload.close()
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
        this.count = 0
        this.words = []
        this.searchContainer = {}
        this.originArea = ''
        this.funcArea = ''
        this.searchArea = ''
        this.keyValueTreeArea = ''
        this.chartArea = ''
        this.tablink = ''
        this.tabcontent = ''
        this.keyValueSelect = {}

        this.tmpSearch = ''
        this.activeFunc = ''

        this.keyValueTree = ''
        this.sequentialChart = ''

        this.llt = ''
        this.openFile()
    }

    async openFile(){
        let that = this

        // var start = new Date()
        await service.emit('new', {'path':this.file.filePaths[0], 'handle_type':'parallel'}, (res) => {
            var response = res
            that.uid = response.uid
            that.name = response.filename
            that.count = response.count
            that.words = response.words
            that.parent.containerFiles[that.uid] = that
            that.init()
            // var end   = new Date()
            // console.log((end.getTime() - start.getTime()) / 1000)
            document.getElementById(that.uid+'-tablink').click()
        })
    }

    init(){
        let that = this
        this.tablink = document.createElement('div')
        this.tablink.style.float = 'left'

        var title = document.createElement('button')
        title.setAttribute('id', this.uid+'-tablink')
        title.style.backgroundColor = '#555'
        title.style.color = 'white'
        title.style.border = 'none'
        title.style.cursor = 'pointer'
        title.style.padding = '5px 8px'
        title.style.fontSize = '12px'
        title.style.width = `${this.name.length * 8}px`
        title.className = "tablink"
        title.innerHTML = this.name
        title.addEventListener('click', function()
        {
            that.parent.openPage(that.uid+'-tabcontent', title)
        })

        var close = document.createElement('button')
        close.style.backgroundColor = 'red'
        close.style.color = 'white'
        close.style.cursor = 'pointer'
        close.style.padding = '5px 8px'
        close.style.fontSize = '12px'
        close.innerHTML = 'X'
        close.addEventListener("click", function() {
            that.parent.deleteFile(that.uid)
        })
        this.tablink.appendChild(title)
        this.tablink.appendChild(close)
    
        this.tabcontent = document.createElement('div')
        this.tabcontent.setAttribute('id', this.uid+'-tabcontent')
        this.tabcontent.style.display = 'none'
        this.tabcontent.style.color = 'white'
        this.tabcontent.className = "tabcontent"
    
        this.originArea = document.createElement('div')
        this.originArea.style.width = '100%'
        this.originArea.style.overflow = 'hidden'
        // this.originArea.style.overflow = 'auto'
        this.originArea.style.border = '2px solid #ddd'
        this.originArea.style.height = `${document.body.offsetHeight - 20}px`

        this.llt = new LazyLogTable('O/'+this.uid+'/', this.originArea, this.count)

        var tab = document.createElement('div')
        tab.style.backgroundColor = '#333'
        tab.style.width = '100%'

        var search = document.createElement('button')
        search.style.color = '#FFF'
        search.fontSize = '30px'
        search.innerHTML = 'Search'
        search.style.backgroundColor = '#555'
        search.style.width = '33%'
        search.addEventListener("click", function() {
            that.openFunc('SEARCH')
        })

        var keyValueTree = document.createElement('button')
        keyValueTree.style.color = '#FFF'
        keyValueTree.fontSize = '30px'
        keyValueTree.innerHTML = 'KeyValueTree'
        keyValueTree.style.backgroundColor = '#555'
        keyValueTree.style.width = '33%'
        keyValueTree.addEventListener("click", function() {
            that.openFunc('KEYVALUETREE')
            that.openKeyValueTree()
        })

        var chart = document.createElement('button')
        chart.style.color = '#FFF'
        chart.fontSize = '30px'
        chart.innerHTML = 'Chart'
        chart.style.backgroundColor = '#555'
        chart.style.width = '32%'
        chart.addEventListener("click", function() {
            that.openFunc('CHART')
        })

        var hidden = document.createElement('button')
        hidden.style.color = '#FFF'
        hidden.style.backgroundColor = '#FF9900'
        hidden.style.float = 'right'
        hidden.style.width = '2%'
        hidden.fontSize = '30px'
        hidden.innerHTML = '-'
        hidden.addEventListener("click", function() {
            that.dragCanvas(0)
        })

        tab.append(search)
        tab.append(keyValueTree)
        tab.append(chart)
        tab.append(hidden)

        this.searchArea = document.createElement('div')
        this.searchArea.style.display = 'none'
        this.searchArea.style.width = '100%'
        this.searchArea.style.border = '2px solid #ddd'

        this.keyValueTreeArea = document.createElement('div')
        this.keyValueTreeArea.style.display = 'none'
        this.keyValueTreeArea.style.width = '100%'
        this.keyValueTreeArea.style.border = '2px solid #ddd'

        this.chartArea = document.createElement('div')
        this.chartArea.style.display = 'none'
        this.chartArea.style.width = '100%'
        this.chartArea.style.border = '2px solid #ddd'

        this.funcArea = document.createElement('div')
        this.funcArea.style.overflowY = 'auto'
        this.funcArea.append(tab)
        this.funcArea.append(this.searchArea)
        this.funcArea.append(this.keyValueTreeArea)
        this.funcArea.append(this.chartArea)

        this.tabcontent.append(this.originArea)
        this.tabcontent.append(this.funcArea)
        this.parent.tablinks.append(this.tablink)
        this.parent.tabcontents.append(this.tabcontent)

        this.dragCanvas(0)
    }

    dragCanvas(rate){
        if (rate == 0) {
            this.funcArea.style.display = 'none'
            this.originArea.style.height = `${parseInt(document.body.offsetHeight - 30)}px`
            this.llt.slider.style.height = `${parseInt(document.body.offsetHeight - 30)}px`
            this.llt.table.style.height = `${parseInt(document.body.offsetHeight - 30)}px`
        }else{
            this.originArea.style.height = `${parseInt((document.body.offsetHeight - 30) * rate)}px`
            this.llt.slider.style.height = `${parseInt((document.body.offsetHeight - 30) * rate)}px`
            this.llt.table.style.height = `${parseInt((document.body.offsetHeight - 30)  * rate)}px`
            this.searchArea.style.height = `${parseInt((document.body.offsetHeight - 30) * rate)}px`
            this.keyValueTreeArea.style.height = `${parseInt((document.body.offsetHeight - 30) * rate)}px`
            this.chartArea.style.height = `${parseInt((document.body.offsetHeight - 30) * rate)}px`
        }
    }

    openFunc(activeFunc){
        this.funcArea.style.display = 'block'
        if (activeFunc == 'SEARCH'){
            this.searchArea.style.display = 'block'
            this.keyValueTreeArea.style.display = 'none'
            this.chartArea.style.display = 'none'
        }else if(activeFunc == 'KEYVALUETREE'){
            this.keyValueTreeArea.style.display = 'block'
            this.searchArea.style.display = 'none'
            this.chartArea.style.display = 'none'
        }else if(activeFunc == 'CHART'){
            this.chartArea.style.display = 'block'
            this.searchArea.style.display = 'none'
            this.keyValueTreeArea.style.display = 'none'
        }
    }

    saveConfig(){
        this.configContent = {'search': []}
        Object.keys(this.searchContainer).forEach((uid) => {
            var ins = this.searchContainer[uid].ins
            this.configContent['search'].push({'desc': ins.desc.value, 'search': ins.expSearch.value, 'regexs': ins.getRegexList(), 'highlights': ins.getHighlightList()})
        })

        this.configContent['select'] = this.keyValueSelect
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
        this.openFunc('SEARCH')
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
        this.dragCanvas(0.5)
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
                    this.searchContainer[uid].res.res_kv.forEach((key) => {
                        keys.push({'name': key, 'check': false})
                    })
                    this.keyValueSelect['children'].push({'uid': uid, 'name': this.searchContainer[uid].ins.desc.value, 'check': false, 'children': keys})
                }
            })
        }else{
            this.keyValueSelect = {'name': this.name, 'check': false}
            var kvs = []
            Object.keys(this.searchContainer).forEach((uid) => {
                var keys = []
                this.searchContainer[uid].res.res_kv.forEach((key) => {
                    keys.push({'name': key, 'check': false})
                })
                kvs.push({'uid': uid, 'name': this.searchContainer[uid].ins.desc.value, 'check': false, 'children': keys})
            })
            this.keyValueSelect['children'] = kvs
        }
        this.keyValueTree = new TreeSelect(this.keyValueSelect, this, this.keyValueTreeArea)
        this.keyValueTree.cancelBtn.style.display = 'none'
    }

    async applyKeyValueTree(){
        let that = this

        await service.emit('sort', {'uid':this.uid, 'key_value_select':this.keyValueSelect}, (res) => {
                if (that.sequentialChart != ''){
                    that.sequentialChart.delete()
                }
                that.generateSequentialChart(res.content)
                that.sequentialChart.chart.resize({height:that.keyValueTreeArea.clientHeight, width:that.keyValueTreeArea.clientWidth})
                that.openFunc('CHART')
            })
    }

    generateSequentialChart(selectedLines){
        this.sequentialChart = new SequentialChart(selectedLines, this.chartArea)
        this.sequentialChart.cancelBtn.style.display = 'none'
    }
    
    openKeyValueTree(){
        if (this.keyValueTree == '') {
            this.generateKeyValueTree()
        }
        this.keyValueTree.open()
    }

    // closeKeyValueTree(){
    //     this.keyValueTree.close()
    // }

    // openSequentialChart(){
    //     this.sequentialChart.open()
    // }

    // closeSequentialChart(){
    //     this.sequentialChart.close()
    // }

    close(){
        service.emit('close', {'uid': this.uid}, (res) => {
            common.removeAll(this.tablink)
            common.removeAll(this.tabcontent)
        })
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
        this.llt = ''
        // this.desc.value = "search test"
        // this.expSearch.value = "txlProcBranchE & (pmb | txAtt)"
        // this.expRegex.value = "%{STRING:device}: \\[%{TIMESTAMP:time}\\] \\(%{STRING:cost}\\) %{STRING:name} %{STRING:trace}: %{DROP:tmp}txAtt:%{INT:txAtt}, txAttPeak:%{INT:txAttPeak},%{DROP:tmp}torTemperature:%{INT:torTemperature} "
    }

    register(position){
        position.append(this.modal)
    }

    async search(){
        let that = this
        let params = {
            uid: this.parent.uid + '/' + this.uid,
            desc: this.desc.value,
            exp_search: this.expSearch.value,
            exp_regex: this.getRegexList(),
            exp_condition: [],
            highlights: this.getHighlightList()
        }
        await service.timeout(10000).emit('search', params, (err, res) => {
            console.log(err)
            that.res = res
            console.log(res)
            if (that.uid == ''){
                that.uid = that.res.uid

                that.resButton = document.createElement('div')
                that.resButton.style.width = '100%'

                var del = document.createElement('button')
                del.style.backgroundColor = 'red'
                del.style.width = '2%'
                del.style.border = '1px solid #ddd'
                del.style.color = 'white'
                del.style.cursor = 'pointer'
                del.fontSize = '15px'
                del.innerHTML = 'X'

                var search = document.createElement('button')
                search.style.backgroundColor = 'green'
                search.style.width = '2%'
                search.style.border = '1px solid #ddd'
                search.style.color = 'white'
                search.style.cursor = 'pointer'
                search.fontSize = '15px'
                search.innerHTML = 'O'

                var collapsible = document.createElement('button')
                collapsible.style.backgroundColor = '#777'
                collapsible.style.width = '94%'
                collapsible.style.border = '1px solid #ddd'
                collapsible.style.textAlign = 'left'
                collapsible.style.color = 'white'
                collapsible.style.cursor = 'pointer'
                collapsible.fontSize = '15px'
                collapsible.className = 'collapsible'
                collapsible.innerHTML = '+ ' + that.desc.value + ` (${that.res.count} hits)`
                that.resButton.append(del)
                that.resButton.append(search)
                that.resButton.append(collapsible)
        
                that.resTable = document.createElement('div')
                that.resTable.className = 'content'
                that.resTable.style.width = '100%'

                that.parent.dragCanvas(0.5)
                that.resTable.style.height = that.parent.funcArea.clientHeight
 
                that.llt = new LazyLogTable('S/'+that.parent.uid + '/' + that.uid, that.resTable, that.res.count)
                that.llt.range = 20
                that.llt.refresh(0)
                that.llt.slider.style.height = `${20 * 18}px`
                // that.llt.table.style.height = `${that.parent.funcArea.clientHeight}px`
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
                    that.parent.shutAllSearch()
                    if (that.resTable.style.display === "block") {
                        that.resTable.style.display = "none"
                        that.parent.llt.uid = 'O/'+that.parent.uid+'/'
                        that.parent.llt.refresh(that.parent.llt.point)
                    } else {
                        that.resTable.style.display = "block"
                        that.parent.llt.uid = 'O/'+that.parent.uid+'/'+that.uid
                        that.parent.llt.refresh(that.parent.llt.point)
                    }
                })
                that.parent.addSearch(that)
            }
            else{
                //removeAllChild
                that.llt.count = that.res.count
                that.llt.slider.max = that.res.count
                that.llt.refresh(0)

                that.parent.shutAllSearch()
                that.resTable.style.display = "block"
                that.resButton.lastChild.innerHTML = '+ ' + that.desc.value + ` (${that.res.count} hits)`
                that.parent.updateSearch(that)
            }
            // bind origin area color
            that.parent.llt.uid = 'O/'+that.parent.uid+'/'+that.uid
            that.parent.llt.refresh(that.parent.llt.point)
            that.close()
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

class LazyLogTable
{
    constructor(uid, position, count){
        this.uid = uid
        this.count = count
        this.table = ''
        this.slider = ''
        this.fontSize = 12

        this.lines = []
        this.point = 0
        this.range = 80
        this.init(position)
    }

    init(position){
        let that = this
        var div = document.createElement('div')
        div.style.display = 'inline-block'
        div.style.width = '100%'

        this.table = document.createElement('table')
        this.table.style.display = 'inline-block'
        this.table.style.width = '98%'
        this.table.style.overflowX = 'scroll'
        this.table.style.overflowY= 'hidden'
        this.table.style.whiteSpace = 'nowrap'
        
        this.slider = document.createElement('input')
        this.slider.style.display = 'inline-block'
        this.slider.className = 'slider'
        this.slider.style.position = 'fixed'
        this.slider.style.zIndex = 0
        this.slider.type = 'range'
        this.slider.min = 0
        // this.slider.max = this.lines.length - this.range + parseInt((document.body.offsetHeight - 50) / this.fontSize)
        this.slider.max = this.count
        this.slider.style.width = '1%'
        this.slider.value=0
        this.slider.step=1

        div.append(this.table)
        div.append(this.slider)
        position.append(div)


        this.slider.addEventListener('change', (event) => {
            that.point = parseInt(event.target.value)
            that.refresh(that.point)
        })

        position.addEventListener("wheel", function(e){
            if (e.deltaY < 0){
                that.slider.value = parseInt(that.slider.value) - 1
            }else{
                that.slider.value = parseInt(that.slider.value) + 1
            }
            that.point = parseInt(that.slider.value)
            that.refresh(that.point)
            e.preventDefault()
            e.stopPropagation()
        })

        this.refresh(this.point)
    }

    refresh(point){
        let that = this
        service.emit('scroll', {'uid':this.uid, 'point':point, 'range':this.range}, (res) => {
            common.removeAllChild(this.table)
            that.lines = res.lines
            // that.slider.style.height = `${that.lines.length * 18}px`
            that.lines.forEach((line) => {
                var tr = document.createElement('tr')
                tr.insertAdjacentHTML('beforeend', line)
                that.table.appendChild(tr)
            })
        })
    }

}

export {TextLogicView}