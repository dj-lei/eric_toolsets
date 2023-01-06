import status from '@/config/status.json'
import ns from '@/config/namespace.json'
import common from '@/plugins/common'

import { ipcRenderer } from 'electron'
import { View } from './element'
import { SearchAtomComponentDialog } from './dialog'
import { FileContainerComponentTab, TextFileFunctionComponentTab } from './tab'
import { TextFileOriginalComponentTable, SearchAtomComponentTable } from './table'
import { SearchFunctionComponentList } from './list'
import { SequentialChart } from './chart'
import { TreeSelect } from './svg'
// import { TextLogicFlow } from './flow'

const fs = require('fs')

class TextAnalysisView extends View
{
    constructor(position){
        super(ns.TEXTANALYSIS, position)
        this.fileContainerView = new FileContainerView(this)
        this.initMenu()
    }

    printHtml(){
        console.log(this.container)
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
            if (that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].configPath == ''){
                let file = await ipcRenderer.invoke('export-theme', JSON.stringify(that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].getConfig()))
                that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].configPath = file.filePath.toString()
            }else{
                await ipcRenderer.invoke('save-theme', that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].configPath, JSON.stringify(that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].getConfig()))
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
            that.fileContainerView.newSearch()
        })
        ipcRenderer.on('open-func-area', () => {
            that.printHtml()
            // that.parent.containerFiles[that.parent.activeFile].dragCanvas(0.5)
            // that.parent.containerFiles[that.parent.activeFile].openFunc('SEARCH')
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
        this.fileContainerComponentTab.subscribePlaceholder(textFileNamespace)
        this.socket.emit("new_file", textFileNamespace, path, (response) => {
            if(response.status == status.SUCCESS){
                that.textFileViews[response.model.namespace] = new TextFileView(that, response.model)
                that.fileContainerComponentTab.createNewTablink(that.textFileViews[response.model.namespace])
                that.textFileViews[response.model.namespace].textFileOriginalView.scroll(0)
                if (response.model.namespace ==this.activeTextFileView) {
                    that.fileContainerComponentTab.openTablink(that.textFileViews[response.model.namespace])
                }
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

        this.fileContainerView = fileContainerView
        this.model = model
        this.configPath = ''
        this.configContent = ''
        this.textFileOriginalView = new TextFileOriginalView(this)
        this.textFileFunctionView = new TextFileFunctionView(this)
    }

    openFile(){

    }

    getConfig(){
        var config = {}
        config['search'] = this.textFileFunctionView.searchFunctionView.getSearchAtomViewModels()
        return config
    }

    loadConfig(content){
        this.configPath = content[0]
        this.configContent = JSON.parse(content[1])
        this.textFileFunctionView.searchFunctionView.loadSearchAtomViewModels(this.configContent['search'])
    }
}

class TextFileOriginalView extends View
{
    constructor(textFileView){
        super(`${textFileView.namespace}${ns.TEXTFILEORIGINAL}`, textFileView.container)
        this.textFileOriginalComponentTable = new TextFileOriginalComponentTable(this)
        
        this.textFileView = textFileView
        this.container.style.border = '1px solid #ddd'

        let that = this
        this.socket.on(`refresh`, (lines) => {
            that.textFileOriginalComponentTable.refresh(lines)
        })
    }

    setHeight(height){
        this.textFileOriginalComponentTable.container.style.height = height
    }

    scroll(point){
        this.socket.emit("scroll", point)
    }
}

class TextFileFunctionView extends View
{
    constructor(textFileView){
        super(`${textFileView.namespace}${ns.TEXTFILEFUNCTION}`, textFileView.container)
        this.textFileView = textFileView

        this.container.style.border = '1px solid #ddd'
        this.textFileFunctionComponentTab = new TextFileFunctionComponentTab(this)
        this.searchFunctionView = new SearchFunctionView(this)
        this.chartFunctionView = new ChartFunctionView(this)
        // this.keyValueTreeFunctionView = new KeyValueTreeFunctionView(this)

    }

    setHeight(height){
        this.container.style.height = height
    }
}

class SearchFunctionView extends View
{
    constructor(textFileFunctionView){
        super(`${textFileFunctionView.namespace}${ns.SEARCHFUNCTION}`, textFileFunctionView.container)
        this.textFileFunctionView = textFileFunctionView
        this.searchAtomViews = {}
        this.tmpSearchAtomView = null

        this.searchFunctionComponentList = new SearchFunctionComponentList(this)
    }

    newSearch(){
        let that = this
        if(this.tmpSearchAtomView){
            this.tmpSearchAtomView.searchAtomComponentDialog.display()
        }else{
            var searchAtomViewNamespace = `${this.namespace}/${common.uuidv4()}`
            this.searchFunctionComponentList.subscribePlaceholder(searchAtomViewNamespace)
            this.socket.emit("new_search", {namespace: searchAtomViewNamespace}, (response) => {
                if(response.status == status.SUCCESS){
                    that.tmpSearchAtomView = new SearchAtomView(that, response.model, that.searchFunctionComponentList.getPlaceholder(response.model.namespace))
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
        this.textFileFunctionView.textFileView.textFileOriginalView.setHeight(`${parseInt((document.body.offsetHeight - 30) * 0.5)}px`)
        this.textFileFunctionView.setHeight((`${parseInt((document.body.offsetHeight - 30) * 0.5)}px`))
        this.textFileFunctionView.textFileFunctionComponentTab.display()
        this.tmpSearchAtomView = null
    }

    getSearchAtomViewModels(){
        var ret = []
        Object.keys(this.searchAtomViews).forEach((namespace) => {
            var model = this.searchAtomViews[namespace].model
            var tmp = {namespace: model.namespace, alias: model.alias, desc:model.desc, expSearch: model.expSearch, expExtract: model.expExtract, expSign: model.expSign}
            ret.push(tmp)
        })
        return ret
    }

    loadSearchAtomViewModels(models){
        let that = this
        models.forEach((model) => {
            this.searchFunctionComponentList.subscribePlaceholder(model.namespace)
            this.socket.emit("new_search", model, (response) => {
                if(response.status == status.SUCCESS){
                    that.searchAtomViews[response.model.namespace] = new SearchAtomView(that, response.model, that.searchFunctionComponentList.getPlaceholder(response.model.namespace))
                    that.searchAtomViews[response.model.namespace].updateDialog(response.model)
                    that.searchAtomViews[response.model.namespace].searchAtomComponentDialog.search()
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

        this.chartAtomViews = {}
    }
}

class SearchAtomView extends View
{
    constructor(searchFunctionView, model, container){
        super(model.namespace, container)
        this.searchFunctionView = searchFunctionView
        this.model = model

        this.searchAtomComponentDialog = new SearchAtomComponentDialog(this)
        this.searchAtomComponentTable = null

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
        this.socket.emit("search", model)
        this.searchAtomComponentDialog.hidden()
    }

    scroll(point){
        this.socket.emit("scroll", point)
    }

    refresh(model){
        this.model = model
        if (!this.searchAtomComponentTable){
            this.searchAtomComponentTable = new SearchAtomComponentTable(this)
            this.searchFunctionView.registerNewSearch(this)
        }
        this.searchAtomComponentTable.refresh(this.model)
    }

    delete(){
        super.delete()
        delete this.searchFunctionView.searchAtomViews[this.namespace]
    }

    updateDialog(model){
        this.searchAtomComponentDialog.update(model)
    }
}

class ChartAtomView extends View
{
    constructor(chartFunctionView, model, container){
        super(model.namespace, container)
        this.chartFunctionView = chartFunctionView
        this.model = model

        let that = this
        this.socket.on("refresh", (response) => {
            if(response.status == status.SUCCESS){
                that.refresh(response.model)
            }else{
                alert(response.msg)
            }
        })
    }

    refresh(){
        
    }
}
export {TextAnalysisView} 