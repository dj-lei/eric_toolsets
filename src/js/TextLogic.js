import urls from '@/plugins/urls'
import service from '@/plugins/socket'
import http from '@/plugins/http'
import common from '@/plugins/common'

import { ipcRenderer } from 'electron'
import { SearchDialog, WorkFlowDialog, ShareDownloadDialog } from './dialog'
import { SequentialChart } from './chart'
import { TreeSelect } from './svg'
import { TextLogicFlow } from './flow'

const fs = require('fs')

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
        this.workFlowDialog = ''
        this.workFlow = ''
        this.init()
    }

    init(){
        let that = this
        ipcRenderer.on('open-file', async function () {
            let file = await ipcRenderer.invoke('open-file')
            if(!file.canceled){
                var f = new FileViewer(that.parent, file.filePaths[0])
                f.openFile(function() {
                    document.getElementById(f.uid+'-tablink').click()
                })
            }
        })
        ipcRenderer.on('save-theme', async function () {
            if (that.parent.containerFiles[that.parent.activeFile].configPath == ''){
                let file = await ipcRenderer.invoke('export-theme', JSON.stringify(that.parent.containerFiles[that.parent.activeFile].saveConfig()))
                that.parent.containerFiles[that.parent.activeFile].configPath = file.filePath.toString()
            }else{
                await ipcRenderer.invoke('save-theme', that.parent.containerFiles[that.parent.activeFile].configPath, JSON.stringify(that.parent.containerFiles[that.parent.activeFile].saveConfig()))
            }
        })
        ipcRenderer.on('export-theme', async () => {
            that.parent.containerFiles[that.parent.activeFile].saveConfig()
            let file = await ipcRenderer.invoke('export-theme', JSON.stringify(that.parent.containerFiles[that.parent.activeFile].configContent))
        })
        ipcRenderer.on('import-theme', async () => {
            let content = await ipcRenderer.invoke('import-theme')
            that.parent.containerFiles[that.parent.activeFile].loadConfig(content, function() {})
        })
        ipcRenderer.on('new-search', () => {
            that.newSearchDialog()
        })
        ipcRenderer.on('open-func-area', () => {
            that.parent.containerFiles[that.parent.activeFile].dragCanvas(0.5)
            that.parent.containerFiles[that.parent.activeFile].openFunc('SEARCH')
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
                }).catch(function (error) {
                    alert('Can not link to sharing service!')
                })
            }
        })
        ipcRenderer.on('share-download', async () => {
            // await ipcRenderer.invoke('downloadURL', {url:'http://localhost:8001/download_theme/config.txt'})
            that.openShareDownloadDialog()
        })
        ipcRenderer.on('dcgm-analysis', async () => {
            await service.emit('test', {}, (res) => {
                console.log(res)
            })
        })
        ipcRenderer.on('work-flow', async () => {
            that.openWorkFlow()
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

    async keyValueTreeClickEvent(){
        let that = this

        await service.emit('global_sort', {'global_key_value_select':this.globalKeyValueSelect}, (res) => {
                if (that.globalSequentialChart != '') {
                    that.globalSequentialChart.delete()
                }
                var data = {}
                Object.keys(res.content).forEach((key) => {
                    var fileUid = key.split('.')[0]
                    var searchUid = key.split('.')[1]
                    data[that.parent.containerFiles[fileUid].name+'.'+that.parent.containerFiles[fileUid].searchContainer[searchUid].ins.desc.value+'.'+key.split('.').slice(2).join('.')] = res.content[key]
                })
                that.globalSequentialChart = new SequentialChart(that, res.uid, 'Global Sequential',data, that.parent.screen)
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

    chartClickEvent(params){
        this.parent.containerFiles[params.data.fileUid].title.click()
        this.parent.containerFiles[params.data.fileUid].searchContainer[params.data.searchUid].ins.collapsible.click()
        this.closeGlobalSequentialChart()
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

    openWorkFlow(){
        if (this.workFlowDialog == '') {
            this.workFlowDialog = new WorkFlowDialog(this, this.parent.screen)
        }
        if (this.workFlow != '') {
            this.workFlow.open()
        }else{
            this.workFlowDialog.open()
        }
    }

    async workFlowClickEvent(files, path){
        if (this.workFlow != '') {
            this.workFlow.delete()
        }
        var content = [path, fs.readFileSync(path, 'utf-8')]
        this.workFlow = new TextLogicFlow(this, files, content, this.parent.screen)
        this.workFlow.canvas.style.position = 'fixed'
        this.workFlow.canvas.style.zIndex = 0
        this.workFlow.canvas.style.top = 0
        this.workFlow.canvas.style.left = 0
    }
}

class FileViewer
{
    constructor(parent, file){
        this.parent = parent
        this.uid = ''
        this.file = file
        this.name = ''
        this.title = ''
        this.configPath = ''
        this.configContent = {'search': [], 'keyValueTree':{}}
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
        this.sequentialCharts = {}

        this.llt = ''
    }

    openFile(_callback){
        let that = this

        service.emit('new', {'path':this.file, 'handle_type':'parallel'}, (res) => {
            var response = res
            that.uid = response.uid
            that.name = response.filename
            that.count = response.count
            that.words = response.words
            that.parent.containerFiles[that.uid] = that
            that.init()
            _callback()
        })
    }

    init(){
        let that = this
        this.keyValueSelect = {'name': this.name, 'check': false, 'children': []}
        this.tablink = document.createElement('div')
        this.tablink.style.float = 'left'

        this.title = document.createElement('button')
        this.title.setAttribute('id', this.uid+'-tablink')
        this.title.style.backgroundColor = '#555'
        this.title.style.color = 'white'
        this.title.style.border = 'none'
        this.title.style.cursor = 'pointer'
        this.title.style.padding = '5px 8px'
        this.title.style.fontSize = '12px'
        this.title.style.width = `${this.name.length * 8}px`
        this.title.className = "tablink"
        this.title.innerHTML = this.name
        this.title.addEventListener('click', function()
        {
            that.parent.openPage(that.uid+'-tabcontent', that.title)
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
        this.tablink.appendChild(this.title)
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

        this.llt = new LazyLogTable(this, 'O/'+this.uid+'/', this.originArea, this.count)

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
        // this.searchArea.style.overflowY = 'auto'
        // this.searchArea.style.border = '2px solid #ddd'

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
            this.funcArea.style.height = `${parseInt((document.body.offsetHeight - 30) * rate)}px`
            // this.searchArea.style.height = `${parseInt((document.body.offsetHeight - 30) * rate)}px`
            this.keyValueTreeArea.style.height = `${parseInt((document.body.offsetHeight - 80) * rate)}px`
            this.chartArea.style.height = `${parseInt((document.body.offsetHeight - 80) * rate)}px`
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
        this.configContent = {'search': [], 'keyValueTree':{}}
        Object.keys(this.searchContainer).forEach((uid) => {
            var ins = this.searchContainer[uid].ins
            this.configContent['search'].push({'uid': ins.uid, 'desc': ins.desc.value, 'search': ins.expSearch.value, 'regexs': ins.getRegexList(), 'highlights': ins.getHighlightList()})
        })

        this.configContent['keyValueTree'] = this.sequentialCharts
        return this.configContent
    }

    loadConfig(content, _callback){
        let that = this
        this.count = 1
        this.searchContainer = {}
        this.configPath = content[0]
        this.configContent = JSON.parse(content[1])
        this.configContent['search'].forEach((search) => {
            this.tmpSearch = new SearchAtom(this, search.uid, this.tabcontent)
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
            this.tmpSearch.search(function() {
                if (that.count == that.configContent['search'].length) {
                    Object.keys(that.configContent['keyValueTree']).forEach((uid) => {
                        var title = that.configContent['keyValueTree'][uid]['title']
                        var keyValueSelect = JSON.parse(that.configContent['keyValueTree'][uid]['tree'])
                        that.applyKeyValueTree(title, keyValueSelect)
                    })
                    _callback()
                }
                that.count = that.count + 1
            })
        })
        this.openFunc('SEARCH')
    }

    newSearch(){
        this.tmpSearch = new SearchAtom(this, '', this.tabcontent)
        this.tmpSearch.open()
    }

    openSearch(uid){
        this.searchContainer[uid].ins.open()
    }

    updateSearch(searchAtom){
        this.searchContainer[searchAtom.uid].res = searchAtom.res
        this.generateKeyValueTree()
    }

    addSearch(searchAtom){
        this.searchContainer[searchAtom.uid] = {'ins': searchAtom, 'res': searchAtom.res}
        this.dragCanvas(0.5)
        this.openFunc('SEARCH')
        this.generateKeyValueTree()
    }

    shutAllSearch(){
        var coll = this.searchArea.querySelectorAll(".content")
        for (var i = 0; i < coll.length; i++) {
            coll[i].style.display = "none"
        }
    }

    generateKeyValueTree(){
        if (this.keyValueTree != ''){
            this.keyValueTree.delete()
        }
        this.keyValueSelect = {'name': this.name, 'check': false, 'children': []}
        Object.keys(this.searchContainer).forEach((uid) => {
            var keys = []
            this.searchContainer[uid].res.res_kv.forEach((key) => {
                keys.push({'name': key, 'check': false})
            })
            this.keyValueSelect['children'].push({'uid': uid, 'name': this.searchContainer[uid].ins.desc.value, 'check': false, 'children': keys})
        })
        this.keyValueTree = new TreeSelect(this.keyValueSelect, this, this.keyValueTreeArea)
        this.keyValueTree.cancelBtn.style.display = 'none'
    }

    keyValueTreeClickEvent(){
        this.applyKeyValueTree('Sequential', this.keyValueSelect)
    }

    async applyKeyValueTree(title, keyValueSelect){
        let that = this

        await service.emit('sort', {'uid':this.uid, 'key_value_select':keyValueSelect}, (res) => {
                that.openFunc('CHART')
                that.sequentialCharts[res.uid] = {'title':title, 'tree':JSON.stringify(keyValueSelect)}
                that.generateSequentialChart(res.uid, title, res.content)
            })
    }

    generateSequentialChart(uid, title, selectedLines){
        var data = {}
        Object.keys(selectedLines).forEach((key) => {
            var searchUid = key.split('.')[1]
            data[this.searchContainer[searchUid].ins.desc.value+'.'+key.split('.').slice(2).join('.')] = selectedLines[key]
        })
        var chart = new SequentialChart(this, uid, title, data, this.chartArea)
        chart.chart.resize({height:this.chartArea.clientHeight, width:this.chartArea.clientWidth})
        chart.cancelBtn.style.display = 'none'
    }

    applyChartConfig(uid, title){
        this.sequentialCharts[uid]['title'] = title
    }

    deleteChart(uid){
        delete this.sequentialCharts[uid]
    }

    openKeyValueTree(){
        if (this.keyValueTree == '') {
            this.generateKeyValueTree()
        }
    }

    chartClickEvent(params){
        this.refresh(parseInt(params.data.globalIndex))
        this.searchContainer[params.data.searchUid].ins.refresh(parseInt(params.data.searchIndex))
        this.searchContainer[params.data.searchUid].ins.collapsible.click()
        this.openFunc('SEARCH')
    }

    refresh(point){
        this.llt.refresh(point)
    }

    close(){
        service.emit('close', {'uid': this.uid}, (res) => {
            common.removeAll(this.tablink)
            common.removeAll(this.tabcontent)
        })
    }

}

class SearchAtom extends SearchDialog
{
    constructor(parent, uid, position){
        super()
        this.register(position)
        this.parent = parent
        this.uid = uid
        this.res = {}
        this.select = {}
        this.resButton = ''
        this.resTable = ''
        this.collapsible = ''
        this.llt = ''
    }

    register(position){
        position.append(this.modal)
    }

    search(_callback){
        let that = this
        let params = {
            uid: this.parent.uid + '/' + this.uid,
            desc: this.desc.value,
            exp_search: this.expSearch.value,
            exp_regex: this.getRegexList(),
            exp_condition: this.getConditionList(),
            highlights: this.getHighlightList()
        }
        service.timeout(10000).emit('search', params, (err, res) => {
            if(err){
                console.log(err)
            }

            that.res = res
            if (that.collapsible == ''){
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

                that.collapsible = document.createElement('button')
                that.collapsible.style.backgroundColor = '#777'
                that.collapsible.style.width = '94%'
                that.collapsible.style.border = '1px solid #ddd'
                that.collapsible.style.textAlign = 'left'
                that.collapsible.style.color = 'white'
                that.collapsible.style.cursor = 'pointer'
                that.collapsible.fontSize = '15px'
                that.collapsible.className = 'collapsible'
                that.collapsible.innerHTML = '+ ' + that.desc.value + ` (${that.res.count} hits)`
                that.resButton.append(del)
                that.resButton.append(search)
                that.resButton.append(that.collapsible)
        
                that.resTable = document.createElement('div')
                that.resTable.className = 'content'
                that.resTable.style.width = '100%'

                that.parent.dragCanvas(0.5)
                that.resTable.style.height = that.parent.funcArea.clientHeight
 
                that.llt = new LazyLogTable(that, 'S/'+that.parent.uid + '/' + that.uid, that.resTable, that.res.count)
                that.llt.range = 20
                that.llt.refresh(0)
                that.llt.slider.style.height = `${20 * 18}px`

                that.parent.shutAllSearch()
                that.parent.searchArea.append(that.resButton)
                that.parent.searchArea.append(that.resTable)
        
                // bind button click event
                del.addEventListener("click", function() {
                    that.parent.keyValueSelect['children'].forEach((child, index) => {
                        if (child.uid == that.uid) {
                            that.parent.keyValueSelect['children'].splice(index,1)
                        }
                    })
                    delete that.parent.searchContainer[that.uid]
                    that.parent.generateKeyValueTree()
                    common.removeAll(that.resTable)
                    common.removeAll(that.resButton)
                })

                search.addEventListener("click", function() {
                    that.open()
                })

                that.collapsible.addEventListener("click", function() {
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
            _callback()
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

    getConditionList(){
        var conditions = []
        for (const li of this.conditionUl.children) {
            for (const elm of li.children) {
                if (elm.tagName == 'INPUT'){
                    conditions.push(elm.value)
                }
            }
        }
        return conditions
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

    refresh(point){
        this.llt.refresh(point)
    }
}

class LazyLogTable
{
    constructor(parent, uid, position, count){
        this.parent = parent
        this.uid = uid
        this.count = count
        this.table = ''
        this.slider = ''
        this.fontSize = 12

        this.lines = []
        this.point = 0
        this.range = 60
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
        this.table.style.border = 'none'
        
        this.slider = document.createElement('input')
        this.slider.style.display = 'inline-block'
        this.slider.className = 'slider'
        // this.slider.style.position = 'fixed'
        // this.slider.style.zIndex = 0
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


        this.slider.addEventListener('input', (event) => {
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

        this.refresh(this.point)
    }

    refresh(point){
        let that = this
        this.point = point
        this.slider.value = point
        service.emit('scroll', {'uid':this.uid, 'point':point, 'range':this.range}, (res) => {
            common.removeAllChild(this.table)
            that.lines = res.lines
            that.lines.forEach((line) => {
                var tr = document.createElement('tr')
                tr.insertAdjacentHTML('beforeend', line)
                if(that.uid[0] == 'S'){
                    tr.addEventListener('dblclick', function()
                    {
                        that.parent.parent.llt.refresh(parseInt(tr.firstChild.innerHTML))
                    })
                }
                that.table.appendChild(tr)
            })
            if (that.lines.length < that.range) {
                for(var i=0; i < that.range - that.lines.length; i++){
                    var tr = document.createElement('tr')
                    var td1 = document.createElement('td')
                    td1.setAttribute('style', 'color:#FFF;background-color:#666666;font-size:10px;')
                    var td2 = document.createElement('td')
                    td2.setAttribute('style', 'color:#FFFFFF;white-space:nowrap;font-size:12px;text-align:left')
                    td1.innerHTML = 'END'
                    td2.innerHTML = 'END'
                    tr.appendChild(td1)
                    tr.appendChild(td2)
                    that.table.appendChild(tr)
                }
            }
        })
    }

}

export {TextLogicView, FileViewer}