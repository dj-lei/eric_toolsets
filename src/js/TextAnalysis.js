import urls from '@/plugins/urls'
import service from '@/plugins/socket'
import http from '@/plugins/http'
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
        super('/TextAnalysis', position)
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
            that.fileContainerView.newSearch()
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
        super(`${textAnalysisView.namespace}/FileContainer`, textAnalysisView.container)
        this.fileContainerComponentTab = new FileContainerComponentTab(this)
        this.textFileViews = {}

        this.textAnalysisView = textAnalysisView
        this.activeTextFileView = ''
    }

    newFile(path){
        let that = this
        var textFileNamespace = `${this.namespace}/${common.uuidv4()}`
        this.fileContainerComponentTab.placeholder(textFileNamespace)
        // var fileName = path.split('\/').slice(-1).pop()
        this.socket.emit("new_file", textFileNamespace, path, (model) => {
            that.textFileViews[model.namespace] = new TextFileView(that, model)
            that.fileContainerComponentTab.createNewTablink(that.textFileViews[model.namespace])
            that.textFileViews[model.namespace].textFileOriginalView.scroll()
            if (model.namespace ==this.activeTextFileView) {
                that.fileContainerComponentTab.openTablink(that.textFileViews[model.namespace])
            }
        })
        this.activeTextFileView = textFileNamespace
    }

    newSearch(){
        this.textFileViews[this.activeTextFileView].textFileFunctionView.searchFunctionView.newSearch()
    }
}

class TextFileView extends View
{
    constructor(fileContainerView, model){
        super(model.namespace, fileContainerView.container)
        this.textFileOriginalView = new TextFileOriginalView(this)
        this.textFileFunctionView = new TextFileFunctionView(this)

        this.fileContainerView = fileContainerView
        this.model = model
    }

    init(){
        let that = this
        // this.socket.emit('new', {'path':this.path, 'handle_type':'parallel'}, (res) => {
        //     this.fileContainerView.checkIn(this.uid, this)
        // })
    }

    openFile(){

    }
}

class TextFileOriginalView extends View
{
    constructor(textFileView){
        super(`${textFileView.namespace}/TextFileOriginal`, textFileView.container)
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
        super(`${textFileView.namespace}/TextFileFunction`, textFileView.container)
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
        super(`${textFileView.namespace}/SearchFunction`, textFileFunctionView.container)
        this.textFileFunctionView = textFileFunctionView
        this.searchAtomViews = []

        // this.functionSearchView = new SearchFunctionView(this)
        // this.functionSearchView = new SearchFunctionView(this)
    }

    newSearch(){
        this.tmpSearchAtomView = new SearchAtomView(this)
    }
}

class KeyValueTreeFunctionView 
{
    constructor(textFileFunctionView){
        this.textFileFunctionView = textFileFunctionView
    }
}

class ChartFunctionView
{
    constructor(textFileFunctionView){
        this.textFileFunctionView = textFileFunctionView
    }
}

class SearchAtomView extends View
{
    constructor(searchFunctionView){
        super(`${searchFunctionView.namespace}/${common.uuidv4()}`, searchFunctionView.container)
        this.searchAtomComponentDialog = new SearchAtomComponentDialog(this)
        this.searchAtomComponentTable = new SearchAtomComponentTable(this)

        this.socket.on("refresh", (res) => {
            this.refresh()
        })
    }

    search(){

    }

    refresh(){

    }
}

export {TextAnalysisView} 