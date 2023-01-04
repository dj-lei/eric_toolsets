import status from '@/config/status.json'
import ns from '@/config/namespace.json'
import common from '@/plugins/common'

import { ipcRenderer } from 'electron'
import { SearchAtomComponentDialog } from './dialog'
import { FileContainerComponentTab } from './tab'
import { TextFileOriginalComponentTable, SearchAtomComponentTable } from './table'
import { SequentialChart } from './chart'
import { TreeSelect } from './svg'
// import { TextLogicFlow } from './flow'

import { io } from "socket.io-client"
const fs = require('fs')
const server = "http://127.0.0.1:8000"

class View
{
    constructor(namespace, position){
        this.namespace = namespace
        this.container = document.createElement('div')
        this.socket = io(`${server}${this.namespace}`)
        position.append(this.container)
    }

    register(){

    }

    refresh(){

    }
}

class TextAnalysisView extends View
{
    constructor(position){
        super(ns.TEXTANALYSIS, position)
        this.fileContainerView = new FileContainerView(this)
        this.initMenu()
    }

    initMenu(){
        let that = this
        ipcRenderer.on('open-file', async function () {
            let file = await ipcRenderer.invoke('open-file')
            if(!file.canceled){
                file.filePaths.forEach((path) => {
                    that.fileContainerView.newFile(path)
                })
            }
        })
        ipcRenderer.on('save-theme', async function () {
            if (that.parent.containerFiles[that.parent.activeFile].configPath == ''){
                let file = await ipcRenderer.invoke('export-theme', JSON.stringify(that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].saveConfig()))
                that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].configPath = file.filePath.toString()
            }else{
                await ipcRenderer.invoke('save-theme', that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].configPath, JSON.stringify(that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].saveConfig()))
            }
        })
        ipcRenderer.on('export-theme', async () => {
            await ipcRenderer.invoke('export-theme', JSON.stringify(that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].getConfig()))
        })
        ipcRenderer.on('import-theme', async () => {
            let content = await ipcRenderer.invoke('import-theme')
            that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].loadConfig(content)
        })
        ipcRenderer.on('new-search', () => {
            that.fileContainerView.newTmpSearch()
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
            that.openDcgmAnalysis()
        })
        ipcRenderer.on('work-flow', async () => {
            that.openWorkFlow()
        })
        ipcRenderer.on('video', (e, videoPath) => {
            if (this.videoPlay == '') {
                this.videoPlay = new VideoDialog(this.parent.screen)
            }
            this.videoPlay.play(videoPath)
            this.videoPlay.open()
        })
        ipcRenderer.on('shutdown_all', () => {
            service.emit('shutdown_all', {'shutdown':true}, (res) => {
                console.log(res)
            })
        })
    }
}

class FileContainerView extends View
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.FILECONTAINER}`, textAnalysisView.container)
        this.fileContainerComponentTab = new FileContainerComponentTab(this)
        this.textFileViews = {}

        this.textAnalysisView = textAnalysisView
        this.activeTextFileView = ''
    }

    newFile(path){
        let that = this
        var textFileNamespace = `${this.namespace}/${common.uuidv4()}`
        this.fileContainerComponentTab.placeholder(textFileNamespace)
        this.socket.emit("new_file", textFileNamespace, path, (response) => {
            if(response.status == status.SUCCESS){
                that.textFileViews[response.model.namespace] = new TextFileView(that, response.model)
                that.fileContainerComponentTab.createNewTablink(that.textFileViews[response.model.namespace])
                that.textFileViews[response.model.namespace].textFileOriginalView.scroll()
                if (response.model.namespace ==this.activeTextFileView) {
                    that.fileContainerComponentTab.openTablink(that.textFileViews[response.model.namespace])
                }
            }
        })
        this.activeTextFileView = textFileNamespace
    }

    newTmpSearch(){
        this.textFileViews[this.activeTextFileView].textFileFunctionView.searchFunctionView.newTmpSearch()
    }
}

class TextFileView extends View
{
    constructor(fileContainerView, model){
        super(model.namespace, fileContainerView.container)

        this.fileContainerView = fileContainerView
        this.model = model
        this.configPath = ''

        this.textFileOriginalView = new TextFileOriginalView(this)
        this.textFileFunctionView = new TextFileFunctionView(this)
    }

    init(){
        let that = this
        // this.socket.emit('new', {'path':this.path, 'handle_type':'parallel'}, (res) => {
        //     this.fileContainerView.checkIn(this.uid, this)
        // })
    }

    openFile(){

    }

    getConfig(){
        return this.textFileFunctionView.searchFunctionView.getConfig()
    }

    loadConfig(content){
        this.textFileFunctionView.searchFunctionView.loadConfig()
    }
}

class TextFileOriginalView extends View
{
    constructor(textFileView){
        super(`${textFileView.namespace}${ns.TEXTFILEORIGINAL}`, textFileView.container)
        this.textFileOriginalComponentTable = new TextFileOriginalComponentTable(this)
        
        this.textFileView = textFileView

        let that = this
        this.socket.on(`refresh`, (lines) => {
            that.textFileOriginalComponentTable.refresh(lines)
        })
    }

    init(){

    }

    jump(point){
        this.socket.emit("jump", point)
    }

    scroll(){
        this.socket.emit("scroll")
    }
}

class TextFileFunctionView extends View
{
    constructor(textFileView){
        super(`${textFileView.namespace}${ns.TEXTFILEFUNCTION}`, textFileView.container)
        this.textFileOriginalComponentTable = new TextFileOriginalComponentTable(this)
        this.textFileView = textFileView

        this.searchFunctionView = new SearchFunctionView(this)
        this.keyValueTreeFunctionView = new KeyValueTreeFunctionView(this)
        this.chartFunctionView = new ChartFunctionView(this)
    }
}

class SearchFunctionView extends View
{
    constructor(textFileFunctionView){
        super(`${textFileFunctionView.namespace}${ns.SEARCHFUNCTION}`, textFileFunctionView.container)
        this.textFileFunctionView = textFileFunctionView
        this.searchAtomViews = {}
        this.tmpSearchAtomView = null

        // this.functionSearchView = new SearchFunctionView(this)
        // this.functionSearchView = new SearchFunctionView(this)
    }

    newTmpSearch(){
        let that = this
        if(this.tmpSearchAtomView){
            this.tmpSearchAtomView.searchAtomComponentDialog.display()
        }else{
            var searchAtomViewNamespace = `${this.namespace}/${common.uuidv4()}`
            this.socket.emit("new_tmp_search", searchAtomViewNamespace, (response) => {
                if(response.status == status.SUCCESS){
                    that.tmpSearchAtomView = new SearchAtomView(that, response.model)
                    that.tmpSearchAtomView.searchAtomComponentDialog.display()
                }
            })
        }
    }

    isRegister(namespace){
        if(namespace in this.searchAtomViews){
            return true
        }else{
            return false
        }
    }

    registerNewSearch(searchAtomView){
        this.searchAtomViews[searchAtomView.namespace] = searchAtomView
    }

    getConfig(){
        var ret = []
        Object.keys(this.searchAtomViews).forEach((namespace) => {
            ret.push(this.searchAtomViews[namespace].model)
        })
        return ret
    }

    loadConfig(content){
        content.forEach((searchAtomViewModel) => {
            this.socket.emit("new_tmp_search", searchAtomViewNamespace, (response) => {
                if(response.status == status.SUCCESS){
                    that.tmpSearchAtomView = new SearchAtomView(that, response.model)
                    that.tmpSearchAtomView.searchAtomComponentDialog.display()
                }
            })
        })
    }
}

class KeyValueTreeFunctionView extends View
{
    constructor(textFileFunctionView){
        super(`${textFileFunctionView.namespace}${ns.KEYVALUETREEFUNCTION}`, textFileFunctionView.container)
        this.textFileFunctionView = textFileFunctionView
    }
}

class ChartFunctionView extends View
{
    constructor(textFileFunctionView){
        super(`${textFileFunctionView.namespace}${ns.CHARTFUNCTION}`, textFileFunctionView.container)
        this.textFileFunctionView = textFileFunctionView
    }
}

class SearchAtomView extends View
{
    constructor(searchFunctionView, model){
        super(model.namespace, searchFunctionView.container)
        this.searchFunctionView = searchFunctionView
        this.model = model

        this.searchAtomComponentDialog = new SearchAtomComponentDialog(this)
        this.searchAtomComponentTable = null
        // this.searchAtomComponentTable = new SearchAtomComponentTable(this)

        let that = this
        this.socket.on("refresh", (response) => {
            if(response.status == status.SUCCESS){
                that.refresh(response.model)
            }else{
                alert(response.msg)
            }
        })
    }

    search(model){
        this.model = model
        this.socket.emit("search", model)
    }

    refresh(model){
        if (!this.searchFunctionView.isRegister(self.namespace)){
            this.searchFunctionView.registerNewSearch(this)
        }
        console.log(model)
    }
}

export {TextAnalysisView} 