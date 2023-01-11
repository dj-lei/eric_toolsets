import status from '@/config/status.json'
import ns from '@/config/namespace.json'

import { ipcRenderer } from 'electron'
import { View } from './element'
import { TextFileComponentRegisterCompareGraphDialog, SearchAtomComponentDialog, ChartAtomComponentSvgDialog, StatisticAtomComponentDialog } from './dialog'
import { FileContainerComponentTab, TextFileFunctionComponentTab } from './tab'
import { TextFileOriginalComponentTable, SearchAtomComponentTable } from './table'
import { SearchFunctionComponentList, ChartFunctionComponentList, StatisticFunctionComponentList } from './list'
import { ChartAtomComponentSvg } from './svg'
import { ChartAtomComponentSequentialChart } from './chart'
import { StatisticAtomComponentCustom } from './custom'
// import { TextLogicFlow } from './flow'

const fs = require('fs')

class TextAnalysisView extends View
{
    constructor(position){
        super(ns.TEXTANALYSIS, position)
        this.initMenu()

        new FileContainerView(this)
    }

    onNewObject(args){
        window[args.className](args)
    }

    printHtml(){
        console.log(this.container)
    }

    initMenu(){
        let that = this
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
        this.activeTextFileModel = ''
        let that = this
        
        ipcRenderer.on('open-file', async function () {
            let file = await ipcRenderer.invoke('open-file')
            if(!file.canceled){
                var count = 0
                that.socket.emit("new_file", file.filePaths)
                // file.filePaths.forEach((path) => {
                    
                    // that.socket.emit("new_file", path, (response, activeTextFileModel) => {
                        // if(response.status == status.SUCCESS){
                        //     count = count + 1
                            
                        //     that.newFile(response.model)
                        //     if(count == file.filePaths.length){
                        //         that.activeTextFileModel = activeTextFileModel
                        //         that.fileContainerComponentTab.displayFile(response.model)
                        //     }
                        // }else{
                        //     alert(response.msg)
                        // }
                    // })
                // })
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
        ipcRenderer.on('new-statistic', () => {
            that.newStatistic()
        })
        ipcRenderer.on('open-func-area', () => {
            // that.printHtml()
            that.socket.emit("open_text_file_function")
        })
    }

    onNewFile(textFileModel){
        this.fileContainerComponentTab.subscribePlaceholder(textFileModel.namespace)
        this.fileContainerComponentTab.updatePlaceholder(textFileModel)
    }

    onDisplayFile(namespace){
        this.socket.emit("display_file", namespace)
    }

    onDisplayCompareGraphDialog(chartAtomModel){
        this.fileContainerComponentRegisterCompareGraphDialog.update(chartAtomModel)
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

    newStatistic(){
        this.socket.emit("new_statistic")
    }
}

class TextFileView extends View
{
    constructor(model){
        super(model.namespace)
        this.model = model

        this.textFileComponentRegisterCompareGraphDialog = new TextFileComponentRegisterCompareGraphDialog(this)
        new TextFileOriginalView(this)
        new TextFileFunctionView(this)
    }

    registerCompareGraph(compareGraph){
        this.socket.emit("register_compare_graph", compareGraph)
    }

    onDelete(){
        super.delete()
    }
}

class TextFileOriginalView extends View
{
    constructor(textFileView){
        super(`${textFileView.namespace}${ns.TEXTFILEORIGINAL}`, textFileView.container)
        this.textFileOriginalComponentTable = new TextFileOriginalComponentTable(this)
        
        this.container.style.border = '1px solid #ddd'
        this.socket.emit("set_height", 1)
        this.scroll(0)
    }

    scroll(point){
        this.socket.emit("scroll", point)
    }

    onSetHeight(model){
        this.textFileOriginalComponentTable.container.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
        this.textFileOriginalComponentTable.table.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
        this.textFileOriginalComponentTable.slider.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
    }

    onRefresh(model){
        this.textFileOriginalComponentTable.refresh(model)
    }
}

class TextFileFunctionView extends View
{
    constructor(textFileView){
        super(`${textFileView.namespace}${ns.TEXTFILEFUNCTION}`, textFileView.container)

        this.container.style.border = '1px solid #ddd'
        this.container.style.height = '0px'
        this.textFileFunctionComponentTab = new TextFileFunctionComponentTab(this)
        this.textFileFunctionComponentTab.searchTitle.style.backgroundColor = '#333'
        new SearchFunctionView(this)
        new ChartFunctionView(this)
        new StatisticFunctionView(this)
    }

    onSetHeight(model){
        this.container.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
    }

    onOpenFunction(func){
        this.textFileFunctionComponentTab.openFunction(func)
    }

    onSelectFunction(func){
        this.textFileFunctionComponentTab.openFunction(func)
        this.socket.emit("select", func)
    }

    hidden(){
        this.socket.emit("hidden")
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
        if (model.expSearch != '') {
            tmpSearchAtomView.search(model)
        }
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
        var tmpChartAtomView = new ChartAtomView(model, this.chartFunctionComponentList.getPlaceholder(model.namespace))
        if (!model.selectLines) {
            tmpChartAtomView.apply(model)
        }
    }
}

class StatisticFunctionView extends View
{
    constructor(textFileFunctionView){
        super(`${textFileFunctionView.namespace}${ns.STATISTICFUNCTION}`, textFileFunctionView.container)
        this.statisticFunctionComponentList = new StatisticFunctionComponentList(this)
    }

    onNewStatistic(model){
        this.statisticFunctionComponentList.subscribePlaceholder(model.namespace)
        var tmpStatisticAtomView = new StatisticAtomView(model, this.statisticFunctionComponentList.getPlaceholder(model.namespace))
        if (model.exp != '') {
            tmpStatisticAtomView.statistic(model)
        }
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

    onDelete(){
        super.delete()
        this.socket.emit("delete")
    }

    onRefresh(model){
        this.model = model
        if (!this.searchAtomComponentDialog.alias.value){
            this.onUpdateDialog(model)
        }
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

    apply(model){
        this.chartAtomComponentSvgDialog.hidden()
        this.socket.emit("draw", model)
    }

    onRefresh(model){
        this.model = model
        this.onUpdateDialog()
        this.chartAtomComponentSequentialChart.refresh(this.model.selectLines)
        this.chartAtomComponentSequentialChart.chart.resize({height:`${parseInt(document.body.offsetHeight / 2 - 20)}px`, width:`${document.body.offsetWidth}px`})
    }

    onDisplayCompareGraphDialog(model){
        this.socket.emit("display_compare_graph_dialog", model)
    }

    onDisplayDialog(){
        this.chartAtomComponentSvgDialog.display()
    }

    onUpdateDialog(){
        this.chartAtomComponentSvg.update()
    }
}

class StatisticAtomView extends View
{
    constructor(model, container){
        super(model.namespace, container)
        this.model = model
        this.statisticAtomComponentDialog = new StatisticAtomComponentDialog(this)
        this.statisticAtomComponentCustom = new StatisticAtomComponentCustom(this)

        this.onDisplayDialog()
    }

    statistic(model){
        this.statisticAtomComponentDialog.hidden()
        this.socket.emit("statistic", model)
    }

    getCompareGraph(alias){
        this.socket.emit("get_compare_graph", alias)
    }

    onRefresh(model){
        this.model = model
        this.statisticAtomComponentCustom.refresh(this.model)
    }

    onDisplayDialog(){
        this.statisticAtomComponentDialog.display()
    }
}

export {TextAnalysisView} 