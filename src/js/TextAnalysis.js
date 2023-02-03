import status from '@/config/status.json'
import ns from '@/config/namespace.json'

import { ipcRenderer } from 'electron'
import { View, ListView} from './element'
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
        this.dcgmAnalysisDialog = new DCGMAnalysisDialog(this)
        // this.shareDownloadDialog = new ShareDownloadDialog(this)

        new BatchInsightView(this)
        new BatchStatisticView(this)
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
            that.socket.emit("display_tmp_search_atom_dialog")
        })
        ipcRenderer.on('new-insight', () => {
            that.socket.emit("display_tmp_insight_atom_dialog")
        })
        ipcRenderer.on('new-chart', () => {
            that.socket.emit("display_tmp_chart_atom_svg_dialog")
        })
        ipcRenderer.on('new-statistic', () => {
            that.socket.emit("display_tmp_statistic_atom_dialog")
        })
        ipcRenderer.on('open-func-area', () => {
            that.controlDisplayTextFileFunction()
        })
        ipcRenderer.on('new-batch-insight', () => {
            that.socket.emit("display_batch_insight")
        })
        ipcRenderer.on('new-batch-statistic', () => {
            that.socket.emit("display_batch_statistic")
        })
        ipcRenderer.on('open-batch-insight-view', () => {
            that.socket.emit("display_batch_insight_view")
        })
        ipcRenderer.on('open-batch-statistic-view', () => {
            that.socket.emit("display_batch_statistic_view")
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

    controlDCGMAnalysis(params){
        this.startLoader()
        this.socket.emit("dcgm_analysis", params, async (response) => {
            this.stopLoader()
            if(response.status == status.SUCCESS){
                alert('Dcgm Analysis Complete!')
            }else{
                alert(response.msg)
            }
            this.dcgmAnalysisDialog.hidden()
        })
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
        
        var tmpSearchAtom = document.createElement('div')
        tmpSearchAtom.id = `${namespace}${ns.TMPSEARCHATOMMODEL}`
        var tmpInsightAtom = document.createElement('div')
        tmpInsightAtom.id = `${namespace}${ns.TMPINSIGHATOMMODEL}`
        var tmpChartAtom = document.createElement('div')
        tmpChartAtom.id = `${namespace}${ns.TMPCHARTATOMMODEL}`
        var tmpStatisticAtom = document.createElement('div')
        tmpStatisticAtom.id = `${namespace}${ns.TMPSTATISTICATOMMODEL}`

        this.container.append(tmpSearchAtom)
        this.container.append(tmpInsightAtom)
        this.container.append(tmpChartAtom)
        this.container.append(tmpStatisticAtom)

        this.socket.emit("display")
        console.log(namespace)
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

class SearchAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model
        this.searchAtomComponentDialog = new SearchAtomComponentDialog(this)
        this.searchAtomComponentTable = new SearchAtomComponentTable(this)
    }

    controlSearch(model){
        if(this.namespace.includes(ns.TMPSEARCHATOMMODEL)){
            this.socket.emit("search", model, 'tmp')
        }else{
            this.socket.emit("search", model)
        }
        this.searchAtomComponentDialog.hidden()
    }

    controlScroll(point){
        this.socket.emit("scroll", point)
    }

    onRefreshTable(model){
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
        this.model = model
        this.searchAtomComponentDialog.update(this.model)
    }

    onDelete(){
        this.delete()
        this.socket.emit("delete")
    }
}

class InsightAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model

        this.insightAtomComponentDialog = new InsightAtomComponentDialog(this)
        this.insightAtomComponentTable = new InsightAtomComponentTable(this)

        if(model.alias != ''){
            this.controlInsight(model)
        }
    }

    controlInsight(model){
        if(this.namespace.includes(ns.TMPINSIGHATOMMODEL)){
            this.socket.emit("insight", model, 'tmp')
        }else{
            this.startLoader()
            this.display()
            this.socket.emit("insight", model)
        }
        this.insightAtomComponentDialog.hidden()
    }

    controlScroll(point){
        this.socket.emit("scroll", point)
    }

    onRefreshTable(model){
        this.stopLoader()
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
        this.model = model
        this.insightAtomComponentDialog.update(this.model)
    }

    onDelete(){
        this.delete()
        this.socket.emit("delete")
    }
}

class ChartAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model

        this.chartAtomComponentSvgDialog = new ChartAtomComponentSvgDialog(this)
        this.chartAtomComponentSequentialChart = new ChartAtomComponentSequentialChart(this)

        if(model.alias != ''){
            this.controlChart(model)
        }
    }

    controlChart(model){
        if(this.namespace.includes(ns.TMPCHARTATOMMODEL)){
            this.socket.emit("chart", model, 'tmp')
        }else{
            this.startLoader()
            this.display()
            this.socket.emit("chart", model)
        }
        this.chartAtomComponentSvgDialog.hidden()
    }

    controlClearKeyValueTree(){
        this.socket.emit("clear_key_value_tree")
    }

    controlClickEvent(params){
        this.socket.emit("click_event", params)
    }

    onRefreshChart(model){
        this.stopLoader()
        this.model = model
        this.onUpdateDialog(model)
        this.chartAtomComponentSequentialChart.refresh(this.model.selectLines)
        this.chartAtomComponentSequentialChart.chart.resize({height:`${parseInt(document.body.offsetHeight / 2 - 20)}px`, width:`${document.body.offsetWidth}px`})
    }

    onDisplayDialog(){
        this.chartAtomComponentSvgDialog.display()
    }

    onUpdateDialog(model){
        this.model = model
        this.chartAtomComponentSvgDialog.update(this.model)
    }

    onDelete(){
        this.delete()
        this.socket.emit("delete")
    }
}

class StatisticAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model

        this.statisticAtomComponentDialog = new StatisticAtomComponentDialog(this)
        this.statisticAtomComponentTextarea = new StatisticAtomComponentTextarea(this)

        if(model.alias != ''){
            this.controlStatistic(model)
        }
    }

    controlStatistic(model){
        if(this.namespace.includes(ns.TMPSTATISTICATOMMODEL)){
            this.socket.emit("statistic", model, 'tmp')
        }else{
            this.startLoader()
            this.display()
            this.socket.emit("statistic", model)
        }
        this.statisticAtomComponentDialog.hidden()
    }

    controlStatisticTest(model){
        this.startLoader()
        this.socket.emit("statistic_test", model)
    }

    controlGetCompareGraph(alias){
        this.socket.emit("get_compare_graph", alias)
    }

    onRefreshTextarea(model){
        this.stopLoader()
        this.model = model
        this.onUpdateDialog(this.model)
        this.statisticAtomComponentTextarea.refresh(this.model)
    }

    onRefreshTest(model){
        this.stopLoader()
        this.model = model
        this.statisticAtomComponentDialog.refreshTest(this.model)
    }

    onDisplayDialog(){
        this.statisticAtomComponentDialog.display()
    }

    onUpdateDialog(model){
        this.model = model
        this.statisticAtomComponentDialog.update(this.model)
    }

    onDelete(){
        this.delete()
        this.socket.emit("delete")
    }
}

class BatchInsightView extends View
{
    constructor(fileContainerView){
        super(`${fileContainerView.namespace}${ns.BATCHINSIGHT}`, fileContainerView.container)

        this.batchInsightComponentDialog = new BatchInsightComponentDialog(this)
        this.batchInsightComponentSvgDialog = new BatchInsightComponentSvgDialog(this)
        this.batchInsightComponentTableDialog = new BatchInsightComponentTableDialog(this)
    }

    controlBatchInsight(dirPath, config){
        this.socket.emit("new", dirPath, config)
        this.batchInsightComponentTableDialog.batchInsightComponentTable.deleteTableAllChilds()
        this.batchInsightComponentDialog.hidden()
        this.batchInsightComponentTableDialog.display()
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

    onRefresh(sample){
        this.batchInsightComponentTableDialog.batchInsightComponentTable.refresh(sample)
    }

    onDisplayDialog(){
        this.batchInsightComponentDialog.display()
    }

    onDisplayTableDialog(){
        this.batchInsightComponentTableDialog.display()
    }
}

class BatchStatisticView extends View
{
    constructor(fileContainerView){
        super(`${fileContainerView.namespace}${ns.BATCHSTATISTIC}`, fileContainerView.container)

        this.batchStatisticComponentDialog = new BatchStatisticComponentDialog(this)
        this.batchStatisticComponentTableDialog = new BatchStatisticComponentTableDialog(this)
    }

    controlBatchStatistic(dirPath, config){
        this.socket.emit("new", dirPath, config)
        this.batchStatisticComponentTableDialog.batchStatisticComponentTable.deleteTableAllChilds()
        this.batchStatisticComponentDialog.hidden()
        this.batchStatisticComponentTableDialog.display()
    }

    onRefresh(sample){
        this.batchStatisticComponentTableDialog.batchStatisticComponentTable.refresh(sample)
    }

    onDisplayDialog(){
        this.batchStatisticComponentDialog.display()
    }

    onDisplayTableDialog(){
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