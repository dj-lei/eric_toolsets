import status from '@/config/status.json'
import ns from '@/config/namespace.json'

import { ipcRenderer } from 'electron'
import { View, ListView} from './element'
import { SystemTestComponentDialog, BatchStatisticComponentDialog, BatchInsightComponentDialog, SearchAtomComponentDialog, InsightAtomComponentDialog, StatisticAtomComponentDialog, DCGMAnalysisDialog, ShareDownloadDialog } from './dialog'
import { FileContainerComponentTab, TextFileFunctionComponentTab } from './tab'
import { TextFileOriginalComponentTable, SearchAtomComponentTable, InsightAtomComponentTable, BatchInsightComponentTableDialog, BatchStatisticComponentTableDialog } from './table'
import { SearchFunctionComponentList, InsightFunctionComponentList, ChartFunctionComponentList, StatisticFunctionComponentList } from './list'
import { BatchInsightComponentSvgDialog, ChartAtomComponentSvgDialog, GlobalChartComponentSvgDialog } from './svg'
import { GlobalChartComponentSequentialChartDialog, ChartAtomComponentSequentialChart } from './chart'
import { StatisticAtomComponentTextarea } from './textarea'
// import { TextLogicFlow } from './flow'

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
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            let wheelEvent = new WheelEvent('wheel', {
                deltaY: 1,
                deltaMode: 1
            })
            for(var i=0; i < 10; i++){
                this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].view.table.dispatchEvent", model, wheelEvent)
            }
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].edit.click", model)
            
            var newModel = JSON.parse(JSON.stringify(config['search'][config['search'].length - 1 - index]))
            newModel['alias'] = newModel['alias']+'_TEST'
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].onUpdateDialog", model, newModel)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].dialog.apply.click", model)

            model = newModel
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            for(i=0; i < 10; i++){
                this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].view.table.dispatchEvent", model, wheelEvent)
            }
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].collapsible.click", model)

            // this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.searchFunctionView.namespace + '/' + model.alias].del.click", model)
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
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            let wheelEvent = new WheelEvent('wheel', {
                deltaY: 1,
                deltaMode: 1
            })
            for(var i=0; i < 10; i++){
                this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].view.table.dispatchEvent", model, wheelEvent)
            }
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].edit.click", model)

            var newModel = JSON.parse(JSON.stringify(config['insight'][config['insight'].length - 1 - index]))
            newModel['alias'] = newModel['alias']+'_TEST'
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].onUpdateDialog", model, newModel)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].dialog.apply.click", model)
            
            model = newModel
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            for(i=0; i < 10; i++){
                this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].view.table.dispatchEvent", model, wheelEvent)
            }
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            // this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.insightFunctionView.namespace + '/' + model.alias].del.click", model)
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
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.alias].edit.click", model)
            
            var newModel = JSON.parse(JSON.stringify(config['chart'][config['chart'].length - 1 - index]))
            newModel['alias'] = newModel['alias']+'_TEST'
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.alias].onUpdateDialog", model, newModel)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.alias].dialog.chartAtomComponentSvg.apply.click", model)
            model = newModel
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            // this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.chartFunctionView.namespace + '/' + model.alias].del.click", model)
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
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.alias].collapsible.click", model)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.alias].edit.click", model)

            var newModel = JSON.parse(JSON.stringify(config['statistic'][config['statistic'].length - 1 - index]))
            newModel['alias'] = newModel['alias']+'_TEST'
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.alias].onUpdateDialog", model, newModel)
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.alias].dialog.apply.click", model)
            model = newModel
            this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.alias].collapsible.click", model)

            // this.forDelayedExec("that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.views[that.fileContainerView.textFileViews[that.fileContainerView.activeTextFileView].textFileFunctionView.statisticFunctionView.namespace + '/' + model.alias].del.click", model)
        })
    }
}

class TextAnalysisView extends View
{
    constructor(position){
        super(ns.TEXTANALYSIS, position)
        this.initMenu()

        this.fileContainerView = new FileContainerView(this)
        this.systemTest = new SystemTestView(this)
    }

    onNewObject(args){
        if (args.class_name == 'TextFileView') {
            this.fileContainerView.textFileViews[args.namespace] = new TextFileView(args.namespace)
        }else if (args.class_name == 'TextFileOriginalView') {
            this.fileContainerView.textFileViews[this.getTextFileViewNamespace(args.namespace)].textFileOriginalView = new TextFileOriginalView(args.namespace)
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

    getTextFileViewNamespace(namespace){
        return namespace.split('/').slice(0,4).join('/')
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
        this.textFileViews = {}
        this.activeTextFileView = ''

        this.fileContainerComponentTab = new FileContainerComponentTab(this)
        this.dcgmAnalysisDialog = new DCGMAnalysisDialog(this)
        // this.shareDownloadDialog = new ShareDownloadDialog(this)

        this.batchInsightView = new BatchInsightView(this)
        this.batchStatisticView = new BatchStatisticView(this)
        // new GlobalChartView(this)

        let that = this
        ipcRenderer.on('open-file', async function () {
            let file = await ipcRenderer.invoke('open-file')
            if(!file.canceled){
                that.controlNewFile(file.filePaths)
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

    controlNewFile(filePaths){
        this.socket.emit("new_file", filePaths)
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
        this.activeTextFileView = params.active_text_file_model
        this.fileContainerComponentTab.displayFile(params)
    }
}

class TextFileView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.tmpSearchAtomView = ''
        this.tmpInsightAtomView = ''
        this.tmpChartAtomView = ''
        this.tmpStatisticAtomView = ''

        this.textFileOriginalView = ''
        this.textFileFunctionView = ''

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
        this.textFileOriginalComponentTable.container.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rate_height)}px`
        this.textFileOriginalComponentTable.table.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rate_height)}px`
        this.textFileOriginalComponentTable.slider.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rate_height)}px`
    }

    onRefreshTable(model){
        this.textFileOriginalComponentTable.refresh(model)
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
        this.container.style.height = `${parseInt((document.body.offsetHeight - 30) * model.rate_height)}px`
    }
}

class SearchFunctionView extends View
{
    constructor(namespace){
        super(namespace, common.getParentContainer(namespace))
        this.views = {}
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
        this.views = {}
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
        this.views = {}
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
        this.views = {}
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
        this.dialog = new SearchAtomComponentDialog(this)
        this.view = new SearchAtomComponentTable(this)
    }

    controlScroll(point){
        this.socket.emit("scroll", point)
    }
}

class InsightAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model

        this.dialog = new InsightAtomComponentDialog(this)
        this.view = new InsightAtomComponentTable(this)
    }

    controlScroll(point){
        this.socket.emit("scroll", point)
    }
}

class ChartAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model
        this.dialog = new ChartAtomComponentSvgDialog(this)
        this.view = new ChartAtomComponentSequentialChart(this)
    }

    controlClearKeyValueTree(){
        this.socket.emit("clear_key_value_tree")
    }

    controlClickEvent(params){
        this.socket.emit("click_event", params)
    }

    onRefresh(model){
        super.onRefresh(model)
        this.view.chart.resize({height:`${parseInt(document.body.offsetHeight / 2 - 20)}px`, width:`${document.body.offsetWidth}px`})
    }
}

class StatisticAtomView extends ListView
{
    constructor(model){
        super(model.namespace, document.getElementById(model.namespace))
        this.model = model
        this.dialog = new StatisticAtomComponentDialog(this)
        this.view = new StatisticAtomComponentTextarea(this)
    }

    controlStatisticTest(model){
        this.socket.emit("statistic_test", model)
    }

    controlGetCompareGraph(alias){
        this.socket.emit("get_compare_graph", alias)
    }

    onRefreshTest(model){
        this.model = model
        this.statisticAtomComponentDialog.refreshTest(this.model)
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
        this.batchInsightComponentDialog.hidden()
        this.batchInsightComponentSvgDialog.display()
    }

    controlGetUniversal(clusterNum){
        this.socket.emit("get_universal", clusterNum, async (response) => {
            console.log(response)
            this.batchInsightComponentTableDialog.batchInsightComponentTable.refreshUniversal(response)
            this.batchInsightComponentTableDialog.display()
        })
    }

    controlGetSingleInsight(namespace){
        this.socket.emit("get_single_insight", namespace, async (response) => {
            console.log(response)
            this.batchInsightComponentTableDialog.batchInsightComponentTable.refreshSingleInsight(response)
            this.batchInsightComponentTableDialog.display()
        })
    }

    onRefresh(clusterTree){
        this.batchInsightComponentSvgDialog.batchInsightComponentSvg.update(clusterTree)
    }

    onDisplayDialog(){
        this.batchInsightComponentDialog.display()
    }

    onDisplaySvgDialog(){
        this.batchInsightComponentSvgDialog.display()
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