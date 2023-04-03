import status from '@/config/status.json'
import ns from '@/config/namespace.json'

import { ipcRenderer } from 'electron'
import { View, ListView, BatchView} from './element'
import { SystemTestComponentDialog, TextFileCompareComponentDialog, BatchStatisticComponentDialog, BatchInsightComponentDialog, SearchAtomComponentDialog, InsightAtomComponentDialog, StatisticAtomComponentDialog, ScriptDialog, DCGMAnalysisDialog, TelogAnalysisDialog, ShareDownloadDialog } from './dialog'
import { FileContainerComponentTab, TextFileFunctionComponentTab } from './tab'
import { TextFileOriginalComponentTable, SearchAtomComponentTable, InsightAtomComponentTable, BatchInsightComponentTableDialog, BatchStatisticComponentTableDialog } from './table'
import { SearchFunctionComponentList, InsightFunctionComponentList, ChartFunctionComponentList, StatisticFunctionComponentList } from './list'
import { TextFileOriginalComponentSvg, TextFileCompareComponentSvgDialog, BatchInsightComponentSvgDialog, ChartAtomComponentSvgDialog, GlobalChartComponentSvgDialog, ChartAtomComponentLineChart } from './svg'
import { StatisticAtomComponentTextarea } from './textarea'
import { TextFileOriginalComponentNavigate } from './navigate'

import common from '@/plugins/common'

const fs = require('fs')

class SystemTestView extends View
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.SYSTEMTEST}`, textAnalysisView.container)
        this.textAnalysisView = textAnalysisView
        this.fileContainerView = this.textAnalysisView.fileContainerView

        this.systemTestComponentDialog = new SystemTestComponentDialog(this)

        this.cmdNum = 0
        let that = this
        ipcRenderer.on('system-test', async function () {
            // that.systemTestComponentDialog.display()
            await that.basicTest('', '')
        })
    }

    async basicTest(dirPath, configPath){
        configPath = 'D:\\projects\\ericsson_flow\\new_files\\config3.txt'
        let that = this
        let file = await ipcRenderer.invoke('open-file')
        if(!file.canceled){
            that.fileContainerView.controlNewFile(file.filePaths)
        }
        setTimeout(function () {
            that.chartTest(JSON.parse(fs.readFileSync(configPath, 'utf-8')))
        }, 1000)
    }

    delayedExec(func, ...params){
        let that = this
        setTimeout(function () {
            if (params.length == 0){
                eval(`${func}()`)
            }else if(params.length == 1){
                eval(`${func}(params[0])`)
            }else if(params.length == 2){
                eval(`${func}(params[0], params[1])`)
            }else if(params.length == 3){
                eval(`${func}(params[0], params[1], params[2])`)
            }
        }, this.cmdNum * 100)
        this.cmdNum = this.cmdNum + 1
    }

    forDelayedExec(func, model, ...params){
        let that = this
        setTimeout(function () {
            if (params.length == 0){
                eval(`${func}()`)
            }else if(params.length == 1){
                eval(`${func}(params[0])`)
            }else if(params.length == 2){
                eval(`${func}(params[0], params[1])`)
            }else if(params.length == 3){
                eval(`${func}(params[0], params[1], params[2])`)
            }
        }, this.cmdNum * 100)
        this.cmdNum = this.cmdNum + 1
    }

    searchTest(config){
        config['search'].forEach((model) => {
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onHiddenDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onUpdateDialog", model)
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.dialog.apply.click")
        })

        config['search'].forEach((model, index) => {
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].collapsible.click", model)
            let wheelEvent = new WheelEvent('wheel', {
                deltaY: 1,
                deltaMode: 1
            })
            for(var i=0; i < 10; i++){
                this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].view.table.dispatchEvent", model, wheelEvent)
            }
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].collapsible.click", model)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].edit.click", model)
            
            var newModel = JSON.parse(JSON.stringify(config['search'][config['search'].length - 1 - index]))
            newModel['name'] = newModel['name']+'_TEST'
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].onUpdateDialog", model, newModel)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].dialog.apply.click", model)

            model = newModel
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].collapsible.click", model)
            for(i=0; i < 10; i++){
                this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].view.table.dispatchEvent", model, wheelEvent)
            }
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].collapsible.click", model)

            // this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.name].del.click", model)
        })
    }

    insightTest(config){
        config['insight'].forEach((model) => {
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpInsightAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpInsightAtomView.onHiddenDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpInsightAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpInsightAtomView.onUpdateDialog", model)
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpInsightAtomView.dialog.apply.click")
        })

        config['insight'].forEach((model, index) => {
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].collapsible.click", model)
            let wheelEvent = new WheelEvent('wheel', {
                deltaY: 1,
                deltaMode: 1
            })
            for(var i=0; i < 10; i++){
                this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].view.table.dispatchEvent", model, wheelEvent)
            }
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].collapsible.click", model)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].edit.click", model)

            var newModel = JSON.parse(JSON.stringify(config['insight'][config['insight'].length - 1 - index]))
            newModel['name'] = newModel['name']+'_TEST'
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].onUpdateDialog", model, newModel)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].dialog.apply.click", model)
            
            model = newModel
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].collapsible.click", model)
            for(i=0; i < 10; i++){
                this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].view.table.dispatchEvent", model, wheelEvent)
            }
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].collapsible.click", model)
            // this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.name].del.click", model)
        })
    }

    chartTest(config){
        config['search'].forEach((model) => {
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onHiddenDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onUpdateDialog", model)
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.dialog.apply.click")
        })

        config['chart'].forEach((model) => {
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpChartAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpChartAtomView.onHiddenDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpChartAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpChartAtomView.onUpdateDialog", model)
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpChartAtomView.dialog.chartAtomComponentSvg.apply.click")
        })

        config['chart'].forEach((model, index) => {
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.name].collapsible.click", model)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.name].edit.click", model)
            
            var newModel = JSON.parse(JSON.stringify(config['chart'][config['chart'].length - 1 - index]))
            newModel['name'] = newModel['name']+'_TEST'
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.name].onUpdateDialog", model, newModel)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.name].dialog.chartAtomComponentSvg.apply.click", model)
            model = newModel
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.name].collapsible.click", model)
            // this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.name].del.click", model)
        })
    }

    statisticTest(config){
        config['search'].forEach((model) => {
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onHiddenDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.onUpdateDialog", model)
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpSearchAtomView.dialog.apply.click")
        })

        config['statistic'].forEach((model) => {
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpStatisticAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpStatisticAtomView.onHiddenDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpStatisticAtomView.onDisplayDialog")
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpStatisticAtomView.onUpdateDialog", model)
            this.delayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].tmpStatisticAtomView.dialog.apply.click")
        })

        config['statistic'].forEach((model, index) => {
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.name].collapsible.click", model)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.name].edit.click", model)

            var newModel = JSON.parse(JSON.stringify(config['statistic'][config['statistic'].length - 1 - index]))
            newModel['name'] = newModel['name']+'_TEST'
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.name].onUpdateDialog", model, newModel)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.name].dialog.apply.click", model)
            model = newModel
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.name].collapsible.click", model)

            // this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.name].del.click", model)
        })
    }
}

class TextAnalysisView extends View
{
    constructor(position){
        super(ns.TEXTANALYSIS, position)

        this.fileContainerView = new FileContainerView(this)
        this.textFileCompareView = new TextFileCompareView(this)
        this.scriptView = new ScriptView(this)

        // this.systemTest = new SystemTestView(this)
        // this.batchInsightView = new BatchInsightView(this)
        // this.batchStatisticView = new BatchStatisticView(this)
        // this.globalChartView = new GlobalChartView(this)

        let that = this
        ipcRenderer.on('shutdown', () => {
            that.socket.emit("shutdown")
        })
        ipcRenderer.on('new-batch-insight', () => {
            that.socket.emit("display_batch_insight")
        })
        ipcRenderer.on('new-batch-statistic', () => {
            that.socket.emit("display_batch_statistic")
        })
        ipcRenderer.on('open-batch-insight-show', () => {
            that.socket.emit("display_batch_insight_show")
        })
        ipcRenderer.on('open-batch-statistic-show', () => {
            that.socket.emit("display_batch_statistic_show")
        })
        ipcRenderer.on('new-global-chart', () => {
            that.socket.emit("display_global_chart")
        })
        ipcRenderer.on('open-global-chart-show', () => {
            that.socket.emit("display_global_chart_show")
        })
        ipcRenderer.on('new-text-file-compare', () => {
            that.socket.emit("display_text_file_compare")
        })
        ipcRenderer.on('open-text-file-compare-show', () => {
            that.socket.emit("display_text_file_compare_show")
        })
        ipcRenderer.on('open-script', () => {
            that.socket.emit("display_script")
        })
    }

    controlDisplayBatchInsight(){
        this.socket.emit("display_batch_insight")
    }

    controlDisplayBatchStatistic(){
        this.socket.emit("display_batch_statistic")
    }

    onNewObject(args){
        if (args.class_name == 'TextFileView') {
            this.fileContainerView.textFileViews[args.namespace] = new TextFileView(args.namespace)
        }else if (args.class_name == 'TextFileOriginalView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.namespace)].textFileOriginalView = new TextFileOriginalView(this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.namespace)], args.namespace, args.model)
        }else if (args.class_name == 'TextFileFunctionView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.namespace)].textFileFunctionView = new TextFileFunctionView(args.namespace)
        }else if (args.class_name == 'SearchFunctionView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.namespace)].textFileFunctionView.searchFunctionView = new SearchFunctionView(args.namespace)
        }else if (args.class_name == 'InsightFunctionView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.namespace)].textFileFunctionView.insightFunctionView = new InsightFunctionView(args.namespace)
        }else if (args.class_name == 'ChartFunctionView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.namespace)].textFileFunctionView.chartFunctionView = new ChartFunctionView(args.namespace)
        }else if (args.class_name == 'StatisticFunctionView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.namespace)].textFileFunctionView.statisticFunctionView = new StatisticFunctionView(args.namespace)
        }else if (args.class_name == 'SearchAtomView') {
            if (args.model.namespace.split('/').length == 5) {
                this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.model.namespace)].tmpSearchAtomView = new SearchAtomView(args.model)
            }else{
                this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.model.namespace)].textFileFunctionView.searchFunctionView.views[args.model.namespace] = new SearchAtomView(args.model)
            }
        }else if (args.class_name == 'InsightAtomView') {
            if (args.model.namespace.split('/').length == 5) {
                this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.model.namespace)].tmpInsightAtomView = new InsightAtomView(args.model)
            }else{
                this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.model.namespace)].textFileFunctionView.insightFunctionView.views[args.model.namespace] = new InsightAtomView(args.model)
            }
        }else if (args.class_name == 'ChartAtomView') {
            if (args.model.namespace.split('/').length == 5) {
                this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.model.namespace)].tmpChartAtomView = new ChartAtomView(args.model)
            }else{
                this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.model.namespace)].textFileFunctionView.chartFunctionView.views[args.model.namespace] = new ChartAtomView(args.model)
            }
        }else if (args.class_name == 'StatisticAtomView') {
            if (args.model.namespace.split('/').length == 5) {
                this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.model.namespace)].tmpStatisticAtomView = new StatisticAtomView(args.model)
            }else{
                this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.model.namespace)].textFileFunctionView.statisticFunctionView.views[args.model.namespace] = new StatisticAtomView(args.model)
            }
        }
    }

    onChangeObject(args){
        if (args.class_name == 'SearchAtomView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.searchFunctionView.views[args.new_namespace] = this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.searchFunctionView.views[args.old_namespace]
            delete this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.searchFunctionView.views[args.old_namespace]
        }else if (args.class_name == 'InsightAtomView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.insightFunctionView.views[args.new_namespace] = this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.insightFunctionView.views[args.old_namespace]
            delete this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.insightFunctionView.views[args.old_namespace]
        }else if (args.class_name == 'ChartAtomView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.chartFunctionView.views[args.new_namespace] = this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.chartFunctionView.views[args.old_namespace]
            delete this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.chartFunctionView.views[args.old_namespace]
        }else if (args.class_name == 'StatisticAtomView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.statisticFunctionView.views[args.new_namespace] = this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.statisticFunctionView.views[args.old_namespace]
            delete this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.old_namespace)].textFileFunctionView.statisticFunctionView.views[args.old_namespace]
        }
    }
}

class FileContainerView extends View
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.FILECONTAINER}`, textAnalysisView.container)
        this.parent = textAnalysisView
        this.textFileViews = {}
        this.activeTextFileView = ''

        this.show = new FileContainerComponentTab(this)
        // this.dcgmAnalysisDialog = new DCGMAnalysisDialog(this)
        // this.telogAnalysisDialog = new TelogAnalysisDialog(this)
        this.shareDownloadDialog = new ShareDownloadDialog(this)

        let that = this
        document.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
        
            var filePaths = []
            var configPath = ''
            var scriptPath = ''
            for (const f of event.dataTransfer.files) {
                // Using the path attribute to get absolute file path
                if (f.path.includes('.ecfg')) {
                    configPath = f.path
                }else if (f.path.includes('.escp')) {
                    scriptPath = f.path
                }else{
                    filePaths.push(f.path)
                }
            }
            if (filePaths.length > 0) {
                that.controlNewFile(filePaths)
            }
            if (configPath != '') {
                that.controlLoadConfig(configPath)
            }
            if (scriptPath != '') {
                that.controlLoadScript(scriptPath)
            }
        })
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        ipcRenderer.on('open-file', async function () {
            let file = await ipcRenderer.invoke('open-file')
            if(!file.canceled){
                that.controlNewFile(file.filePaths)
            }
        })
        ipcRenderer.on('import-config', async () => {
            let config = await ipcRenderer.invoke('import-config')
            if (config != '') {
                that.controlLoadConfig(config)
            }
        })
        ipcRenderer.on('save-config', async function () {
            if (that.textFileViews[that.activeTextFileView].model.config != ''){
                await ipcRenderer.invoke('save-config', that.textFileViews[that.activeTextFileView].model.path, JSON.stringify(that.getAllFuncViewsConfig()))
            }else{
                let path = await ipcRenderer.invoke('export-config', JSON.stringify(that.getAllFuncViewsConfig()))
                that.textFileViews[that.activeTextFileView].model.path = path
                await that.textFileViews[that.activeTextFileView].controlSync()
            }
        })
        ipcRenderer.on('export-config', async () => {
            let path = await ipcRenderer.invoke('export-config', JSON.stringify(that.getAllFuncViewsConfig()))
            that.textFileViews[that.activeTextFileView].model.path = path
            await that.textFileViews[that.activeTextFileView].controlSync()
        })
        ipcRenderer.on('import-script', async () => {
            let script = await ipcRenderer.invoke('import-script')
            if (script != '') {
                that.controlLoadScript(script)
            }
        })
        ipcRenderer.on('save-script', async function () {
            if (that.parent.scriptView.model.path){
                await ipcRenderer.invoke('save-script', that.parent.scriptView.model.path, JSON.stringify(that.getScript()))
            }else{
                let path = await ipcRenderer.invoke('export-script', JSON.stringify(that.getScript()))
                that.parent.scriptView.model.path = path
                await that.parent.scriptView.controlSync()
            }
        })
        ipcRenderer.on('export-script', async () => {
            let path = await ipcRenderer.invoke('export-script', JSON.stringify(that.getScript()))
            that.parent.scriptView.model.path = path
            await that.parent.scriptView.controlSync()
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
        ipcRenderer.on('dcgm-analysis', () => {
            that.dcgmAnalysisDialog.display()
        })
        ipcRenderer.on('open-share', () => {
            that.shareDownloadDialog.refresh()
            that.shareDownloadDialog.display()
        })
    }

    getAllFuncViewsConfig(){
        var config = {'search':[], 'chart':[], 'statistic':[], 'insight': []}
        var searchViews = this.textFileViews[this.activeTextFileView].textFileFunctionView.searchFunctionView.views
        Object.keys(searchViews).forEach(namespace => {
            config.search.push(searchViews[namespace].dialog.model())
        })
        var chartViews = this.textFileViews[this.activeTextFileView].textFileFunctionView.chartFunctionView.views
        Object.keys(chartViews).forEach(namespace => {
            config.chart.push(chartViews[namespace].dialog.model())
        })
        var statisticViews = this.textFileViews[this.activeTextFileView].textFileFunctionView.statisticFunctionView.views
        Object.keys(statisticViews).forEach(namespace => {
            config.statistic.push(statisticViews[namespace].dialog.model())
        })
        return config
    }

    getScript(){
        return this.parent.scriptView.dialog.model()
    }

    controlNewFile(filePaths){
        this.socket.emit("new_file", filePaths)
    }

    controlDisplayFile(namespace){
        this.socket.emit("display_file", namespace)
    }

    controlDeleteFile(namespace){
        var namespaces = Object.keys(this.show.tabs)
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
        common.removeAll(this.show.tabs[namespace].ins)
        delete this.show.tabs[namespace]
        this.socket.emit("delete_file", namespace)
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

    controlLoadScript(script){
        this.socket.emit("load_script", script)
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
        this.socket.emit("dcgm_analysis", params, async (response) => {
            if(response.status == status.SUCCESS){
                alert('Dcgm Analysis Complete!')
            }else{
                alert(response.msg)
            }
            this.dcgmAnalysisDialog.hidden()
        })
    }

    controlTelogAnalysis(params){
        this.socket.emit("telog_analysis", params, async (response) => {
            if(response.status == status.SUCCESS){
                alert('Telog Analysis Complete!')
            }else{
                alert(response.msg)
            }
            this.dcgmAnalysisDialog.hidden()
        })
    }

    controlDisplayTextFileFunction(){
        this.socket.emit("display_text_file_function")
    }

    onNewFile(textFileModel){
        this.show.subscribePlaceholder(textFileModel.namespace)
        this.show.updatePlaceholder(textFileModel)
    }

    onDisplayFile(params){
        this.activeTextFileView = params.active_text_file
        this.show.displayFile(params)
    }
}

class TextFileView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.container.style.overflow = 'hidden'
        this.tmpSearchAtomView = ''
        this.tmpInsightAtomView = ''
        this.tmpChartAtomView = ''
        this.tmpStatisticAtomView = ''

        this.textFileOriginalView = ''
        this.textFileFunctionView = ''

        var tmpSearchAtom = document.createElement('div')
        tmpSearchAtom.id = `${namespace}${ns.TMPSEARCHATOM}`
        var tmpInsightAtom = document.createElement('div')
        tmpInsightAtom.id = `${namespace}${ns.TMPINSIGHATOM}`
        var tmpChartAtom = document.createElement('div')
        tmpChartAtom.id = `${namespace}${ns.TMPCHARTATOM}`
        var tmpStatisticAtom = document.createElement('div')
        tmpStatisticAtom.id = `${namespace}${ns.TMPSTATISTICATOM}`

        this.container.append(tmpSearchAtom)
        this.container.append(tmpInsightAtom)
        this.container.append(tmpChartAtom)
        this.container.append(tmpStatisticAtom)
    }
}

class TextFileOriginalView extends View
{
    constructor(parent, namespace, model){
        super(namespace, common.getParentContainer(namespace))
        this.parent = parent
        this.model = model
        this.container.style.border = '1px solid #ddd'
        this.navigate = new TextFileOriginalComponentNavigate(this)
        this.tableShow = new TextFileOriginalComponentTable(this)
        this.svgShow = new TextFileOriginalComponentSvg(this, this.container)
        this.svgShow.hidden()
    }

    getSearchAtomIns(d){
        return this.parent.textFileFunctionView.searchFunctionView.views[this.namespace.replace('TextFileOriginal', `TextFileFunction/SearchFunction/${d.identifier}`)]
    }

    controlScroll(point){
        var range = parseInt(this.container.clientHeight / 18) + 1
        this.socket.emit("scroll", point, range)
    }

    controlJump(d){
        this.socket.emit("jump", d)
    }

    onSetHeight(model){
        this.tableShow.container.style.height = `${parseInt((document.body.offsetHeight - 50) * model.rate_height)}px`
        this.tableShow.table.style.height = `${parseInt((document.body.offsetHeight - 50) * model.rate_height)}px`
        this.tableShow.slider.style.height = `${parseInt((document.body.offsetHeight - 50) * model.rate_height)}px`
        this.svgShow.container.style.height = `${parseInt((document.body.offsetHeight - 50) * model.rate_height)}px`
    }

    onRefresh(model){
        this.model = model
        this.tableShow.refresh(model)
    }

    onRefreshStoryLines(model){
        this.model = model
        this.svgShow.update(model.data_tree)
    }

}

class TextFileFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.searchFunctionView = ''
        this.insightFunctionView = ''
        this.chartFunctionView = ''
        this.statisticFunctionView = ''

        this.container.style.border = '1px solid #ddd'
        // this.container.style.height = '0px'
        this.container.style.overflowY = 'auto'
        this.show = new TextFileFunctionComponentTab(this, common.getParentContainer(namespace))
        common.getParentContainer(namespace).insertBefore(this.show.container, this.container)
        this.controlHidden()
    }

    controlHidden(){
        this.socket.emit("hidden")
    }

    controlSelectFunction(func){
        this.socket.emit("select_function", func)
    }

    onDisplayFunction(func){
        this.show.displayFunction(func)
    }

    onSetHeight(model){
        this.container.style.height = `${parseInt((document.body.offsetHeight - 130) * model.rate_height)}px`
    }

    onDisplay(){
        super.onDisplay()
        this.show.display()
    }

    onHidden(){
        super.onHidden()
        this.show.hidden()
    }
}

class SearchFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.views = {}
        this.show = new SearchFunctionComponentList(this)
    }

    onNew(model){
        this.show.subscribePlaceholder(model.namespace)
    }
}

class ChartFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.views = {}
        this.show = new ChartFunctionComponentList(this)
    }

    onNew(model){
        this.show.subscribePlaceholder(model.namespace)
    }
}

class InsightFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.views = {}
        this.show = new InsightFunctionComponentList(this)
    }

    onNew(model){
        this.show.subscribePlaceholder(model.namespace)
    }
}

class StatisticFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.views = {}
        this.show = new StatisticFunctionComponentList(this)
    }

    onNew(model){
        this.show.subscribePlaceholder(model.namespace)
    }
}

class SearchAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))

        this.model = model
        this.dialog = new SearchAtomComponentDialog(this)
        this.show = new SearchAtomComponentTable(this, this.container)
    }

    controlScroll(point){
        this.socket.emit("scroll", point)
    }

    controlJump(point){
        this.socket.emit("jump", point)
    }

    controlGetAllLines(ins, scrollRow){
        this.socket.emit("get_all_lines", async (response) => {
            if(response.status == status.SUCCESS){
                ins.displayBottomTip(response.model, scrollRow)
            }else{
                alert(response.msg)
            }
        })
    }

    controlTextClickEvent(params){
        this.socket.emit("text_click_event", params)
    }
}

class ChartAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model
        this.dialog = new ChartAtomComponentSvgDialog(this)
        this.show = new ChartAtomComponentLineChart(this)
    }

    controlClearKeyValueTree(){
        this.socket.emit("clear_key_value_tree")
    }

    controlClickEvent(params){
        this.socket.emit("click_event", params)
    }

    onRefresh(model){
        super.onRefresh(model)
        // this.show.chart.resize({height:`${parseInt(document.body.offsetHeight / 2 - 100)}px`, width:`${document.body.offsetWidth}px`})
    }
}

class InsightAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model

        this.dialog = new InsightAtomComponentDialog(this)
        this.show = new InsightAtomComponentTable(this)
    }

    controlChartClickEvent(params){
        this.socket.emit("chart_click_event", params)
    }

    controlTextClickEvent(params){
        this.socket.emit("text_click_event", params)
    }
}

class StatisticAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model
        this.dialog = new StatisticAtomComponentDialog(this)
        this.show = new StatisticAtomComponentTextarea(this)
    }

    controlStatisticTest(model){
        this.socket.emit("statistic_test", model)
    }

    onRefreshTest(model){
        this.model = model
        this.dialog.refreshTest(this.model)
    }
}

class TextFileCompareView extends BatchView
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.TEXTFILECOMPARE}`, textAnalysisView.container)
        this.parent = textAnalysisView
        this.dialog = new TextFileCompareComponentDialog(this)
        this.show = new TextFileCompareComponentSvgDialog(this)
    }

    onUpdateDialog(model){
        this.model = model
        this.dialog.update(this.model)
    }

    onRefresh(model){
        // this.show.display()
        
        this.model = model
        var first = this.parent.fileContainerView.textFileViews[this.getTextFileViewNamespace(model.first)].textFileOriginalView
        var second = this.parent.fileContainerView.textFileViews[this.getTextFileViewNamespace(model.second)].textFileOriginalView
        this.show.refresh(first, second)
    }
}

class ScriptView extends BatchView
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.SCRIPT}`, textAnalysisView.container)
        this.parent = textAnalysisView
        this.dialog = new ScriptDialog(this)
    }

    controlExec(model){
        this.socket.emit("exec", model)
    }

    onConsole(msg){
        this.dialog.log(msg)
    }
}

class BatchInsightView extends BatchView
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.BATCHINSIGHT}`, textAnalysisView.container)
        this.parent = textAnalysisView
        this.dialog = new BatchInsightComponentDialog(this)
        this.show = new BatchInsightComponentSvgDialog(this)
        this.batchInsightComponentTableDialog = new BatchInsightComponentTableDialog(this)
    }

    controlGetUniversal(clusterNum){
        this.socket.emit("get_universal", clusterNum, async (response) => {
            this.batchInsightComponentTableDialog.batchInsightComponentTable.refreshUniversal(response)
            this.batchInsightComponentTableDialog.display()
        })
    }

    controlGetSingleInsight(namespace){
        // this.socket.emit("get_single_insight", namespace, async (response) => {
        //     console.log(response)
        //     this.batchInsightComponentTableDialog.batchInsightComponentTable.refreshSingleInsight(response)
        //     this.batchInsightComponentTableDialog.display()
        // })
    }

    onRefresh(model){
        if (model.surplus > 0) {
            this.socket.emit("polling")
        }
        this.show.refresh(model.cluster_tree)
    }
}

class BatchStatisticView extends BatchView
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.BATCHSTATISTIC}`, textAnalysisView.container)
        this.parent = textAnalysisView
        this.dialog = new BatchStatisticComponentDialog(this)
        this.show = new BatchStatisticComponentTableDialog(this)
    }

    controlCode(code){
        this.socket.emit("code", code)
    }

    onRefreshCode(sample){
        this.show.refreshCode(sample)
    }
}

class GlobalChartView extends BatchView
{
    constructor(textAnalysisView){
        super(`${textAnalysisView.namespace}${ns.GLOBALCHART}`, textAnalysisView.container)

        this.dialog = new GlobalChartComponentSvgDialog(this)
        this.show = new GlobalChartComponentSequentialChartDialog(this)
    }

    controlClearKeyValueTree(){
        this.socket.emit("clear_global_key_value_tree")
    }

    controlExec(model){
        this.socket.emit("exec", model)
        this.show.clear()
        this.dialog.hidden()
        this.show.display()
    }

    onRefresh(model){
        super.onRefresh(model)
        this.show.resize()
    }

    onUpdateDialog(model){
        this.model = model
        this.dialog.update(this.model)
    }
}

export {TextAnalysisView}