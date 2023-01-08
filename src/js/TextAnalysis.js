import status from '@/config/status.json'
import ns from '@/config/namespace.json'
import common from '@/plugins/common'

import { ipcRenderer } from 'electron'
import { View } from './element'
import { SearchAtomComponentDialog, ChartAtomComponentSvgDialog } from './dialog'
import { FileContainerComponentTab, TextFileFunctionComponentTab } from './tab'
import { TextFileOriginalComponentTable, SearchAtomComponentTable } from './table'
import { SearchFunctionComponentList, ChartFunctionComponentList } from './list'
import { ChartAtomComponentSvg } from './svg'
import { ChartAtomComponentSequentialChart } from './chart'
// import { TextLogicFlow } from './flow'

const fs = require('fs')

class TextAnalysisView extends View
{
    constructor(position){
        super(ns.TEXTANALYSIS, position)
        this.initMenu()

        new FileContainerView(this)
    }

    printHtml(){
        console.log(this.container)
    }

    initMenu(){
        let that = this
        ipcRenderer.on('open-func-area', () => {
            that.printHtml()
            // that.parent.containerFiles[that.parent.activeFile].dragCanvas(0.5)
            // that.parent.containerFiles[that.parent.activeFile].openFunc('SEARCH')
        })
        // ipcRenderer.on('open-global-keyvalue-tree', () => {
        //     that.openGlobalKeyValueTree()
        // })
        // ipcRenderer.on('open-global-chart', () => {
        //     that.openGlobalSequentialChart()
        // })
        // ipcRenderer.on('share-upload', async () => {
        //     let content = await ipcRenderer.invoke('import-theme')
        //     if(content[1] != ''){
        //         await http.get(urls.save_theme, {
        //             params: {
        //                 filename: content[0],
        //                 theme: content[1]
        //             },
        //             })
        //           .then(response => {
        //                 console.log(response.data)
        //         }).catch(function (error) {
        //             alert('Can not link to sharing service!')
        //         })
        //     }
        // })
        // ipcRenderer.on('share-download', async () => {
        //     // await ipcRenderer.invoke('downloadURL', {url:'http://localhost:8001/download_theme/config.txt'})
        //     that.openShareDownloadDialog()
        // })
        // ipcRenderer.on('dcgm-analysis', async () => {
        //     that.openDcgmAnalysis()
        // })
        // ipcRenderer.on('work-flow', async () => {
        //     that.openWorkFlow()
        // })
        // ipcRenderer.on('video', (e, videoPath) => {
        //     if (this.videoPlay == '') {
        //         this.videoPlay = new VideoDialog(this.parent.screen)
        //     }
        //     this.videoPlay.play(videoPath)
        //     this.videoPlay.open()
        // })
        // ipcRenderer.on('shutdown_all', () => {
        //     service.emit('shutdown_all', {'shutdown':true}, (res) => {
        //         console.log(res)
        //     })
        // })
    }
}

class FileContainerView extends View
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.FILECONTAINER}`, textAnalysisView.container)
        this.fileContainerComponentTab = new FileContainerComponentTab(this)

        let that = this
        ipcRenderer.on('open-file', async function () {
            let file = await ipcRenderer.invoke('open-file')
            if(!file.canceled){
                file.filePaths.forEach((path) => {
                    that.socket.emit("new_file", path, (response) => {
                        if(response.status == status.SUCCESS){
                            that.newFile(response.model)
                        }else{
                            alert(response.msg)
                        }
                    })
                })
            }
        })
        // ipcRenderer.on('save-theme', async function () {
        //     if (that.textFileViews[that.activeTextFileView].configPath == ''){
        //         let file = await ipcRenderer.invoke('export-theme', JSON.stringify(that.textFileViews[that.activeTextFileView].getConfig()))
        //         that.textFileViews[that.activeTextFileView].configPath = file.filePath.toString()
        //     }else{
        //         await ipcRenderer.invoke('save-theme', that.textFileViews[that.fileContainerView.activeTextFileView].configPath, JSON.stringify(that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].getConfig()))
        //     }
        // })
        ipcRenderer.on('export-config', async () => {
            await that.getConfig()
        })
        ipcRenderer.on('import-config', async () => {
            let config = await ipcRenderer.invoke('import-config')
            that.loadConfig(config)
        })
        ipcRenderer.on('new-search', () => {
            that.newSearch()
        })
        ipcRenderer.on('new-chart', () => {
            that.newChart()
        })
    }

    newFile(model){
        new TextFileView(this, model)
        
        this.fileContainerComponentTab.subscribePlaceholder(model.namespace)
        this.fileContainerComponentTab.updatePlaceholder(model)
        // if (model.namespace ==this.model.activeTextFileModel) {
        //     this.fileContainerComponentTab.displayFile(model)
        // }
    }

    displayFile(namespace){
        this.socket.emit("display_file", {namespace: namespace}, (response) => {
            if(response.status == status.SUCCESS){
                that.model = response.model
            }else{
                alert(response.msg)
            }
        })
    }

    getConfig(){
        this.socket.emit("get_config", async (response) => {
            await ipcRenderer.invoke('export-config', JSON.stringify(response.model))
        })
    }

    loadConfig(config){
        this.socket.emit("load_config", config)
    }

    newSearch(){
        this.socket.emit("new_search")
    }

    newChart(){
        this.socket.emit("new_chart")
    }
}

class TextFileView extends View
{
    constructor(fileContainerView, model){
        super(model.namespace, fileContainerView.container)
        this.model = model

        new TextFileOriginalView(this)
        new TextFileFunctionView(this)
    }
}

class TextFileOriginalView extends View
{
    constructor(textFileView){
        super(`${textFileView.namespace}${ns.TEXTFILEORIGINAL}`, textFileView.container)
        this.textFileOriginalComponentTable = new TextFileOriginalComponentTable(this)
        
        this.container.style.border = '1px solid #ddd'
        this.scroll(0)
    }

    scroll(point){
        this.socket.emit("scroll", point)
    }

    onSetHeight(model){
        this.textFileOriginalComponentTable.container.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
    }

    onRefresh(model){
        this.textFileOriginalComponentTable.refresh(model.displayLines)
    }
}

class TextFileFunctionView extends View
{
    constructor(textFileView){
        super(`${textFileView.namespace}${ns.TEXTFILEFUNCTION}`, textFileView.container)

        this.container.style.border = '1px solid #ddd'
        this.textFileFunctionComponentTab = new TextFileFunctionComponentTab(this)
        new SearchFunctionView(this)
        new ChartFunctionView(this)
    }

    setHeight(height){
        this.container.style.height = height
    }

    onSetHeight(model){
        this.container.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
    }
}

class SearchFunctionView extends View
{
    constructor(textFileFunctionView){
        super(`${textFileFunctionView.namespace}${ns.SEARCHFUNCTION}`, textFileFunctionView.container)

        this.searchFunctionComponentList = new SearchFunctionComponentList(this)
    }

    onNewSearch(model){
        this.searchFunctionComponentList.subscribePlaceholder(model.namespace)
        var tmpSearchAtomView = new SearchAtomView(model, this.searchFunctionComponentList.getPlaceholder(model.namespace))
        tmpSearchAtomView.search(model)
    }
}

class ChartFunctionView extends View
{
    constructor(textFileFunctionView){
        super(`${textFileFunctionView.namespace}${ns.CHARTFUNCTION}`, textFileFunctionView.container)
        this.chartFunctionComponentList = new ChartFunctionComponentList(this)
    }

    onNewChart(model){
        this.chartFunctionComponentList.subscribePlaceholder(model.namespace)
        new ChartAtomView(model, this.chartFunctionComponentList.getPlaceholder(model.namespace))
    }
}

class SearchAtomView extends View
{
    constructor(model, container){
        super(model.namespace, container)
        this.model = model

        this.searchAtomComponentDialog = new SearchAtomComponentDialog(this)
        this.searchAtomComponentTable = new SearchAtomComponentTable(this)

        this.onDisplayDialog()
    }

    search(model){
        this.socket.emit("search", model)
        this.searchAtomComponentDialog.hidden()
    }

    scroll(point){
        this.socket.emit("scroll", point)
    }

    delete(){
        super.delete()
        delete this.searchFunctionView.searchAtomViews[this.namespace]
    }

    onRefresh(model){
        this.model = model
        this.onUpdateDialog(this.model)
        this.searchAtomComponentTable.refresh(this.model)
    }

    onDisplayDialog(){
        this.searchAtomComponentDialog.display()
    }

    onUpdateDialog(model){
        this.searchAtomComponentDialog.update(model)
    }
}

class ChartAtomView extends View
{
    constructor(model, container){
        super(model.namespace, container)
        this.model = model
        this.chartAtomComponentSvgDialog = new ChartAtomComponentSvgDialog(this)
        this.chartAtomComponentSvg = new ChartAtomComponentSvg(this, this.chartAtomComponentSvgDialog.subContainer)
        this.chartAtomComponentSequentialChart = new ChartAtomComponentSequentialChart(this)

        this.onDisplayDialog()
    }

    apply(){
        this.socket.emit("draw", this.model.keyValueTree)
    }

    onRefresh(model){
        this.model = model
        console.log(this.model)
        this.chartAtomComponentSequentialChart.refresh(this.model.selectLines)
        this.chartAtomComponentSequentialChart.chart.resize({height:'400px', width:'1000px'})
    }

    onDisplayDialog(){
        this.chartAtomComponentSvgDialog.display()
    }
}
export {TextAnalysisView} 