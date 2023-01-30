import status from '@/config/status.json'
import ns from '@/config/namespace.json'

import { ipcRenderer } from 'electron'
import { View } from './element'
import { BatchStatisticComponentDialog, BatchInsightComponentDialog, SearchAtomComponentDialog, InsightAtomComponentDialog, StatisticAtomComponentDialog, DCGMAnalysisDialog, ShareDownloadDialog } from './dialog'
import { FileContainerComponentTab, TextFileFunctionComponentTab } from './tab'
import { TextFileOriginalComponentTable, SearchAtomComponentTable, InsightAtomComponentTable, BatchInsightComponentTableDialog, BatchStatisticComponentTableDialog } from './table'
import { SearchFunctionComponentList, InsightFunctionComponentList, ChartFunctionComponentList, StatisticFunctionComponentList } from './list'
import { BatchInsightComponentSvgDialog, ChartAtomComponentSvgDialog, GlobalChartComponentSvgDialog } from './svg'
import { GlobalChartComponentSequentialChartDialog, ChartAtomComponentSequentialChart } from './chart'
import { StatisticAtomComponentTextarea } from './textarea'
// import { TextLogicFlow } from './flow'

import common from '@/plugins/common'

const fs = require('fs')

class TextAnalysisView extends View
{
    constructor(position){
        super(ns.TEXTANALYSIS, position)
        this.initMenu()

        new FileContainerView(this)
    }

    onNewObject(args){
        if (args.className == 'TextFileView') {
            new TextFileView(args.namespace)
        }else if (args.className == 'TextFileOriginalView') {
            new TextFileOriginalView(args.namespace)
        }else if (args.className == 'TextFileFunctionView') {
            new TextFileFunctionView(args.namespace)
        }else if (args.className == 'SearchFunctionView') {
            new SearchFunctionView(args.namespace)
        }else if (args.className == 'InsightFunctionView') {
            new InsightFunctionView(args.namespace)
        }else if (args.className == 'ChartFunctionView') {
            new ChartFunctionView(args.namespace)
        }else if (args.className == 'StatisticFunctionView') {
            new StatisticFunctionView(args.namespace)
        }else if (args.className == 'SearchAtomView') {
            new SearchAtomView(args.model)
        }else if (args.className == 'InsightAtomView') {
            new InsightAtomView(args.model)
        }else if (args.className == 'ChartAtomView') {
            new ChartAtomView(args.model)
        }else if (args.className == 'StatisticAtomView') {
            new StatisticAtomView(args.model)
        }else if (args.className == 'BatchInsightView') {
            new BatchInsightView(args.namespace)
        }else if (args.className == 'BatchStatisticView') {
            new BatchStatisticView(args.namespace)
        }
    }

    initMenu(){
        let that = this
        // ipcRenderer.on('open-global-keyvalue-tree', () => {
        //     that.openGlobalKeyValueTree()
        // })
        // ipcRenderer.on('open-global-chart', () => {
        //     that.openGlobalSequentialChart()
        // })
        // ipcRenderer.on('share-download', async () => {
        //     // await ipcRenderer.invoke('downloadURL', {url:'http://localhost:8001/download_theme/config.txt'})
        //     that.openShareDownloadDialog()
        // })
        // ipcRenderer.on('dcgm-analysis', async () => {
        //     that.openDcgmAnalysis()
        // })
    }
}

class FileContainerView extends View
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.FILECONTAINER}`, textAnalysisView.container)
        this.fileContainerComponentTab = new FileContainerComponentTab(this)
        // this.batchInsightComponentDialog = new BatchInsightComponentDialog(this)
        // this.batchStatisticComponentDialog = new BatchStatisticComponentDialog(this)
        // this.dcgmAnalysisDialog = new DCGMAnalysisDialog(this)
        // this.shareDownloadDialog = new ShareDownloadDialog(this)

        // new BatchInsightView(this)
        // new BatchStatisticView(this)
        // new GlobalChartView(this)

        let that = this
        ipcRenderer.on('open-file', async function () {
            let file = await ipcRenderer.invoke('open-file')
            if(!file.canceled){
                that.socket.emit("new_file", file.filePaths)
            }
        })
        // ipcRenderer.on('save-config', async function () {
        //     if (that.textFileViews[that.activeTextFileView].configPath == ''){
        //         let file = await ipcRenderer.invoke('export-config', JSON.stringify(that.textFileViews[that.activeTextFileView].getConfig()))
        //         that.textFileViews[that.activeTextFileView].configPath = file.filePath.toString()
        //     }else{
        //         await ipcRenderer.invoke('save-config', that.textFileViews[that.fileContainerView.activeTextFileView].configPath, JSON.stringify(that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].getConfig()))
        //     }
        // })
        ipcRenderer.on('export-config', async () => {
            await that.controlGetConfig()
        })
        ipcRenderer.on('import-config', async () => {
            let config = await ipcRenderer.invoke('import-config')
            if (config[0] != '') {
                that.controlLoadConfig(config)
            }
        })
        ipcRenderer.on('new-search', () => {
            that.tmpSearchAtomComponentDialog.display()
        })
        ipcRenderer.on('new-insight', () => {
            that.tmpInsightAtomComponentDialog.display()
        })
        ipcRenderer.on('new-chart', () => {
            that.tmpChartAtomComponentSvgDialog.display()
        })
        ipcRenderer.on('new-statistic', () => {
            that.tmpStatisticAtomComponentDialog.display()
        })
        ipcRenderer.on('open-func-area', () => {
            that.printHtml()
            // that.controlDisplayTextFileFunction()
        })
        ipcRenderer.on('new-batch-insight', () => {
            that.batchInsightComponentDialog.display()
        })
        ipcRenderer.on('new-batch-statistic', () => {
            that.batchStatisticComponentDialog.display()
        })
        ipcRenderer.on('open-batch-insight-view', () => {
            that.controlDisplayBatchInsight()
        })
        ipcRenderer.on('open-batch-statistic-view', () => {
            that.controlDisplayBatchStatistic()
        })
        ipcRenderer.on('dcgm-analysis', () => {
            that.dcgmAnalysisDialog.display()
        })
        ipcRenderer.on('share-download', () => {
            that.shareDownloadDialog.display()
        })
        ipcRenderer.on('share-upload', async () => {
            let content = await ipcRenderer.invoke('import-config')
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
    }

    printHtml(){
        console.log(this.container)
    }

    controlDisplayFile(namespace){
        this.socket.emit("display_file", namespace)
    }

    controlDeleteFile(namespace){
        this.socket.emit("delete_file", namespace)

        var namespaces = Object.keys(this.fileContainerComponentTab.tabs)
        var index = namespaces.indexOf(namespace)
        if((index == 0)&(namespaces.length == 1)){
            null
        }else if (index == 0){
            index = index + 1
            this.controlDisplayFile(namespaces[index])
        }else{
            index = index - 1
            this.controlDisplayFile(namespaces[index])
        }
        common.removeAll(this.fileContainerComponentTab.tabs[namespace].ins)
        delete this.fileContainerComponentTab.tabs[namespace]
        
    }

    controlGetConfig(){
        this.socket.emit("get_config", async (response) => {
            if(response.status == status.SUCCESS){
                await ipcRenderer.invoke('export-config', JSON.stringify(response.model))
            }else{
                alert(response.msg)
            }
        })
    }

    controlLoadConfig(config){
        this.socket.emit("load_config", config)
    }

    controlSearch(model){
        this.socket.emit("new_search", model)
        this.tmpSearchAtomComponentDialog.hidden()
    }

    controlInsight(model){
        this.socket.emit("new_insight", model)
        this.tmpInsightAtomComponentDialog.hidden()
    }

    controlChart(model){
        this.socket.emit("new_chart", model)
        this.tmpChartAtomComponentSvgDialog.hidden()
    }

    controlStatistic(model){
        this.socket.emit("new_statistic", model)
        this.tmpStatisticAtomComponentDialog.hidden()
    }

    controlBatchInsight(dirPath, config){
        this.socket.emit("new_batch_insight", dirPath, config)
        this.batchInsightComponentDialog.hidden()
    }

    controlBatchStatistic(dirPath, config){
        this.socket.emit("new_batch_statistic", dirPath, config)
        this.batchStatisticComponentDialog.hidden()
    }

    controlDCGMAnalysis(params){
        this.socket.emit("dcgm_analysis", params)
    }

    controlDisplayBatchInsight(){
        this.socket.emit("display_batch_insight")
    }

    controlDisplayBatchStatistic(){
        this.socket.emit("display_batch_statistic")
    }

    controlDisplayTextFileFunction(){
        this.socket.emit("display_text_file_function")
    }

    onNewFile(textFileModel){
        this.fileContainerComponentTab.subscribePlaceholder(textFileModel.namespace)
        this.fileContainerComponentTab.updatePlaceholder(textFileModel)
    }

    onDisplayFile(params){
        this.fileContainerComponentTab.displayFile(params)
    }
}

class TextFileView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        
        // this.textFileComponentRegisterCompareGraphDialog = new TextFileComponentRegisterCompareGraphDialog(this)
        this.tmpSearchAtomComponentDialog = new SearchAtomComponentDialog(this)
        this.tmpInsightAtomComponentDialog = new InsightAtomComponentDialog(this)
        this.tmpChartAtomComponentSvgDialog = new ChartAtomComponentSvgDialog(this)
        this.tmpStatisticAtomComponentDialog = new StatisticAtomComponentDialog(this)

        this.socket.emit("display")
    }

    onRefreshTmpChartAtomSvgDialog(model){
        this.tmpChartAtomComponentSvgDialog.chartAtomComponentSvg.refresh(model.keyValueTree)
    }

    onDisplayTmpChartAtomSvgDialog(){
        this.tmpChartAtomComponentSvgDialog.display()
    }

    onDelete(){
        super.delete()
    }
}

class TextFileOriginalView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.textFileOriginalComponentTable = new TextFileOriginalComponentTable(this)
        
        this.container.style.border = '1px solid #ddd'
        this.controlScroll(0)
    }

    controlScroll(point){
        this.socket.emit("scroll", point)
    }

    onSetHeight(model){
        this.textFileOriginalComponentTable.container.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
        this.textFileOriginalComponentTable.table.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
        this.textFileOriginalComponentTable.slider.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
    }

    onRefreshTable(model){
        this.textFileOriginalComponentTable.refresh(model)
    }
}

class TextFileFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))

        this.container.style.border = '1px solid #ddd'
        this.container.style.height = '0px'
        this.textFileFunctionComponentTab = new TextFileFunctionComponentTab(this)
        this.textFileFunctionComponentTab.searchTitle.style.backgroundColor = '#333'
        this.controlHidden()
    }

    controlHidden(){
        this.socket.emit("hidden")
    }

    controlSelectFunction(func){
        this.socket.emit("select_function", func)
    }

    onDisplayFunction(func){
        this.textFileFunctionComponentTab.displayFunction(func)
    }

    onSetHeight(model){
        this.container.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rateHeight)}px`
    }
}

class SearchFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.searchFunctionComponentList = new SearchFunctionComponentList(this)
    }

    onNew(model){
        this.searchFunctionComponentList.subscribePlaceholder(model.namespace)
    }
}

class InsightFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.insightFunctionComponentList = new InsightFunctionComponentList(this)
    }

    onNew(model){
        this.insightFunctionComponentList.subscribePlaceholder(model.namespace)
    }
}

class ChartFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.chartFunctionComponentList = new ChartFunctionComponentList(this)
    }

    onNew(model){
        this.chartFunctionComponentList.subscribePlaceholder(model.namespace)
    }
}

class StatisticFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.statisticFunctionComponentList = new StatisticFunctionComponentList(this)
    }

    onNew(model){
        this.statisticFunctionComponentList.subscribePlaceholder(model.namespace)
    }
}

class SearchAtomView extends View
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model
        this.searchAtomComponentDialog = new SearchAtomComponentDialog(this)
        this.searchAtomComponentTable = new SearchAtomComponentTable(this)

        if(model.expSearch != ''){
            this.controlSearch(model)
        }
    }

    controlSearch(model){
        this.startLoader()
        this.socket.emit("search", model)
        this.searchAtomComponentDialog.hidden()
    }

    controlScroll(point){
        this.socket.emit("scroll", point)
    }

    onRefreshTable(model){
        this.stopLoader()
        this.model = model
        // console.log(model)
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

    onDelete(){
        super.delete()
        this.socket.emit("delete")
    }
}

class InsightAtomView extends View
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))

        this.insightAtomComponentDialog = new InsightAtomComponentDialog(this)
        this.insightAtomComponentTable = new InsightAtomComponentTable(this)

        if(model.expSearch != ''){
            this.controlInsight(model)
        }
    }

    controlInsight(model){
        this.socket.emit("insight", model)
        this.insightAtomComponentDialog.hidden()
    }

    controlScroll(point){
        this.socket.emit("scroll", point)
    }

    onRefreshTable(model){
        this.model = model
        if (!this.insightAtomComponentDialog.alias.value){
            this.onUpdateDialog(model)
        }
        this.insightAtomComponentTable.refresh(this.model)
    }

    onDisplayDialog(){
        this.insightAtomComponentDialog.display()
    }

    onUpdateDialog(model){
        this.insightAtomComponentDialog.update(model)
    }

    onDelete(){
        super.delete()
        this.socket.emit("delete")
    }
}

class ChartAtomView extends View
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model

        this.chartAtomComponentSvgDialog = new ChartAtomComponentSvgDialog(this)
        this.chartAtomComponentSequentialChart = new ChartAtomComponentSequentialChart(this)

        this.chartAtomComponentSvg.refresh(this.model.keyValueTree)
        if(!model.selectLines){
            this.controlChart(model)
        }
    }

    controlChart(model){
        this.chartAtomComponentSvgDialog.hidden()
        this.socket.emit("chart", model)
    }

    onRefreshChart(model){
        this.model = model
        this.onUpdateDialog()
        this.chartAtomComponentSequentialChart.refresh(this.model.selectLines)
        this.chartAtomComponentSequentialChart.chart.resize({height:`${parseInt(document.body.offsetHeight / 2 - 20)}px`, width:`${document.body.offsetWidth}px`})
    }

    onDisplayDialog(){
        this.chartAtomComponentSvgDialog.display()
    }

    onUpdateDialog(){
        this.chartAtomComponentSvgDialog.chartAtomComponentSvg.update()
    }
}

class StatisticAtomView extends View
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))

        this.statisticAtomComponentDialog = new StatisticAtomComponentDialog(this)
        this.statisticAtomComponentTextarea = new StatisticAtomComponentTextarea(this)

        if(model.exp != ''){
            this.controlStatistic(model)
        }
    }

    controlStatistic(model){
        this.statisticAtomComponentDialog.hidden()
        this.socket.emit("statistic", model)
    }

    controlGetCompareGraph(alias){
        this.socket.emit("get_compare_graph", alias)
    }

    onRefreshTextarea(model){
        this.model = model
        this.statisticAtomComponentTextarea.refresh(this.model)
    }

    onDisplayDialog(){
        this.statisticAtomComponentDialog.display()
    }
}

class BatchInsightView extends View
{
    constructor(fileContainerView){
        super(`${fileContainerView.namespace}${ns.BATCHINSIGHT}`, fileContainerView.container)

        this.batchInsightComponentSvgDialog = new BatchInsightComponentSvgDialog(this)
        this.batchInsightComponentTableDialog = new BatchInsightComponentTableDialog(this)
    }

    controlGetUniversal(clusterNum){
        this.socket.emit("get_universal", clusterNum, async (response) => {
            this.batchInsightComponentTableDialog.batchInsightComponentTable.refreshUniversal(response)
            this.batchInsightComponentTableDialog.display()
        })
    }

    controlGetSingleInsight(namespace){
        this.socket.emit("get_single_insight", namespace, async (response) => {
            this.batchInsightComponentTableDialog.batchInsightComponentTable.refreshSingleInsight(response)
            this.batchInsightComponentTableDialog.display()
        })
    }

    onRefresh(model){
        this.onDisplayDialog()
        this.model = model
        this.batchInsightComponentSvgDialog.batchInsightComponentSvg.refresh(this.model.clusterTree)
    }

    onDisplayDialog(){
        this.batchInsightComponentSvgDialog.display()
    }
}

class BatchStatisticView extends View
{
    constructor(fileContainerView){
        super(`${fileContainerView.namespace}${ns.BATCHSTATISTIC}`, fileContainerView.container)

        this.batchStatisticComponentTableDialog = new BatchStatisticComponentTableDialog(this)
    }

    onRefresh(model){
        this.onDisplayDialog()
        this.model = model
        this.batchStatisticComponentTableDialog.batchStatisticComponentTable.refresh(this.model)
    }

    onDisplayDialog(){
        this.batchStatisticComponentTableDialog.display()
    }
}

class GlobalChartView extends View
{
    constructor(fileContainerView){
        super(`${fileContainerView.namespace}${ns.GLOBALCHART}`, fileContainerView.container)

        this.globalChartComponentSvgDialog = new GlobalChartComponentSvgDialog(this)
        this.globalChartComponentSequentialChartDialog = new GlobalChartComponentSequentialChartDialog(this)
    }

    controlChart(model){
        this.globalChartComponentSvgDialog.hidden()
        this.socket.emit("chart", model)
    }

    onRefreshSvg(model){
        this.model = model
        this.globalChartComponentSvgDialog.globalChartComponentSvg.refresh(this.model)
    }

    onRefreshChart(model){
        this.model = model
        this.globalChartComponentChartDialog.globalChartComponentChart.refresh(this.model.selectLines)
        this.onDisplayChartDialog()
    }

    onDisplaySvgDialog(){
        this.globalChartComponentSvgDialog.display()
    }

    onDisplayChartDialog(){
        this.globalChartComponentSequentialChartDialog.display()
    }
}

export {TextAnalysisView} 