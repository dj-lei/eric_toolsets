import * as echarts from 'echarts'
import common from '@/plugins/common'
import { ChartDialog } from './dialog'

class Chart
{
    constructor(){
        this.canvas = ''
        this.chart = ''
        this.bottomNav = ''
        this.chartInit()
    }

    chartInit(){
        this.canvas = document.createElement('div')
        this.canvas.style.display = "inline-block"
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.style.border = '1px solid #888'
        this.canvas.style.backgroundColor = '#555'

        var ch = document.createElement('div')
        ch.style.width = '99%'
        ch.style.height = '100%'
        ch.style.borderSpacing = 0
        ch.style.border = '1px solid rgb(255, 255, 255)'

        this.bottomNav = document.createElement('div')
        this.bottomNav.style.position = 'fixed'
        this.bottomNav.style.bottom = 0
        this.bottomNav.style.width = '100%'
        this.canvas.append(ch)
        this.canvas.append(this.bottomNav)

        this.chart = echarts.init(ch, 'dark')
    }

    getSequentialChartConfig(){
        return {
          title: {
            text: 'Stacked Line'
          },
          // backgroundColor:'#3F3F3F',
          toolbox:{
            show: true,
            feature:{
            }
          },
          tooltip: {
            trigger: 'axis',
            show: true,
            axisPointer:{
              axis: 'x'
            },
            // layout: 'vertical',
            formatter: (params) => {
              var ret = ''
              params.forEach((param) => {
                if(param['seriesName'] != 'highlight'){
                  ret = ret + param.marker + param.seriesName +"  value:" + param.data['origin'] + '<br/>'
                }
              })
              return ret;
              
            }
          },
          legend: {
            data: [],
            itemWidth:12,
            itemHeight:12,
            left:'20%',
            // type: 'scroll',
            // orient: "vertical",
            textStyle: {
              fontSize: '10',
            },
          },
          xAxis: {
            // type: 'category',
            axisLabel: {
              textStyle:{
                fontSize: "10"
              },
            },
            data: []
          },
          yAxis: {
            axisLabel: {
              textStyle:{
                fontSize: "10"
              },
            }
          },
          dataZoom: [
            {
              type: 'inside',
              throttle: 50,
              start: 0,
              end: 100
            },
            {
              start: 0,
              end: 20
            }
          ],
          series: []
        }
    }

    addButton(name, func, color){
        let that = this
        var button = document.createElement('button')
        button.style.backgroundColor = color
        button.style.color = '#FFF'
        button.style.float = 'right'
        button.style.display = 'block'
        button.style.padding = '14px 16px'
        button.innerHTML = name
        button.addEventListener('click', function()
        {
            func(that)
        })
        this.bottomNav.appendChild(button)
        return button
    }

    open(){
        this.canvas.style.display = "block"
    }

    close(that){
      if(that){
          that.canvas.style.display = "none"
      }else{
          this.canvas.style.display = "none"
      }
    }

    delete(that){
      common.removeAll(this.canvas)
      if (that) {
        that.parent.deleteChart(that.uid)
      }
    }
}

class SequentialChart extends Chart
{
    constructor(parent, uid, title, selectedLine, position){
        super()
        this.register(position)
        this.parent = parent
        this.uid = uid
        this.title = title
        this.config = new ChartDialog(this, this.canvas)
        this.option = {}
        this.selectedLines = selectedLine
        this.draw()
        this.cancelBtn = this.addButton('CANCEL', this.close, 'red')
    }

    register(position){
        position.append(this.canvas)
    }

    draw(){
        let that = this
        // package line
        this.option = this.getSequentialChartConfig()
        this.option['title']['text'] = this.title
        this.option['yAxis'] = []
        this.option['series'] = []
        var yAxisIndex = 0
        var legend = []
        var leftYAxis = []
        var rightYAxis = []

        if (Object.keys(this.selectedLines).length == 0) {
          this.option['yAxis'] = [{'type':'value'}]
        }
        Object.keys(this.selectedLines).forEach((line, index) => {
            if (line.includes('.highlight.')) {
                // var makeLineAxis = []
                var markLine = {
                  silent: true, // mouse move no event
                  symbol: 'none',
                  label:{
                    // color:'#FFFFFF',
                    fontSize:12,
                  },
                  lineStyle:{
                    type:'dotted',
                    width: 2
                  },
                  data:[]
                }
                this.selectedLines[line].forEach((item) => {
                    markLine['data'].push({'xAxis': parseInt(item.graph_index), 'label': {'color': item.value, 'formatter':line.split('.')[line.split('.').length - 1], 'fontSize':10}})
                    // makeLineAxis.push({'value':parseInt(item.graph_index)})
                })
        
                legend.push(line)
                this.option['series'].push(
                  {
                    name: line,
                    type: 'line',
                    showSymbol: false,
                    // data: makeLineAxis,
                    markLine: markLine
                  }
                )
            }else{
                var d = []
            
                if (this.selectedLines[line][0].type == 'STRING'){
                    var values = []
                    this.selectedLines[line].forEach((item) => {
                        values.push(item.value)
                    })
                    var categories = common.arrayDuplicates(values)
                }
                // config yaxis
                var offsetNum = 0
                if (index % 2 == 0) {
                    leftYAxis.push('left')
                    offsetNum = leftYAxis.length - 1
                }else{
                    rightYAxis.push('right')
                    offsetNum = rightYAxis.length - 1
                }
                this.option['yAxis'].push({
                    axisLabel: {
                        textStyle:{
                        fontSize: "8"
                        },
                    },
                    type: this.selectedLines[line][0].type == 'STRING' ? 'category' : 'value',
                    name: line,
                    nameTextStyle: {
                        fontSize:'8',
                        padding:[0, 0, -7 * offsetNum, 0],
                    },
                    position: index % 2 == 0 ? 'left' : 'right', // left or right
                    offset: 30 * offsetNum,
                    data: this.selectedLines[line][0].type == 'STRING' ? categories : null
                })
    
                // package xaxis data
                this.selectedLines[line].forEach((item) => {
                    d.push({'value': [item.graph_index, item.value], 'fileUid':item.file_uid, 'searchUid':item.search_uid, 'globalIndex':item.global_index, 'searchIndex':item.search_index, 'origin':item.value, 'timestamp':item.timestamp})
                })
                
                this.option['series'].push(
                {
                    name: line,
                    type: 'line',
                    yAxisIndex: yAxisIndex,
                    showSymbol: false,
                    data: d,
                }
                )
                yAxisIndex = yAxisIndex + 1
                legend.push(line)
            }
        })
  
        this.option['tooltip']['formatter'] = function(params){
            var ret = ''
            params.forEach((param) => {
                ret = ret + param.marker + param.data.timestamp +'<br/>'+ "&nbsp;&nbsp;&nbsp;&nbsp;" + param.seriesName + ":" + param.data.origin + '<br/>'
            })
            return ret;
        }
        
        // bind click event and paint
        this.option['legend']['data'] = legend
        this.option['xAxis']['type'] = 'value'
        // install tool button 
        this.option['toolbox']['right'] = "3%"
        this.option['toolbox']['feature'] = {
          saveAsImage: {
            show: true,
            excludeComponents: ['toolbox'],
            pixelRatio: 2
          },
          myTool3:{
            show:true,
            title: 'Edit',
            icon: 'path://M499.2 281.6l243.2 243.2L413.866667 853.333333H170.666667v-243.2l328.533333-328.533333z m0 123.733333L256 648.533333V768h119.466667l243.2-243.2-119.466667-119.466667zM614.4 170.666667L853.333333 413.866667l-72.533333 72.533333-243.2-243.2L614.4 170.666667z',
            onclick: (e) =>{
              that.config.desc.value = that.option['title']['text']
              that.config.open()
            }
          },
          myTool2:{
            show:true,
            title: 'Export',
            icon: 'path://M712.533333 371.2l-128 128-59.733333-59.733333 128-128L597.333333 256l-42.666666-42.666667h256v256l-42.666667-42.666666-55.466667-55.466667zM657.066667 256H768v110.933333V256h-110.933333zM298.666667 298.666667v426.666666h426.666666v-256l85.333334 85.333334v256H213.333333V213.333333h256l85.333334 85.333334H298.666667z',
            onclick: (e) =>{
              that.exportExcel()
            }
          },
          myTool1:{
            show:true,
            title: 'Delete',
            icon: 'path://M202.666667 256h-42.666667a32 32 0 0 1 0-64h704a32 32 0 0 1 0 64H266.666667v565.333333a53.333333 53.333333 0 0 0 53.333333 53.333334h384a53.333333 53.333333 0 0 0 53.333333-53.333334V352a32 32 0 0 1 64 0v469.333333c0 64.8-52.533333 117.333333-117.333333 117.333334H320c-64.8 0-117.333333-52.533333-117.333333-117.333334V256z m224-106.666667a32 32 0 0 1 0-64h170.666666a32 32 0 0 1 0 64H426.666667z m-32 288a32 32 0 0 1 64 0v256a32 32 0 0 1-64 0V437.333333z m170.666666 0a32 32 0 0 1 64 0v256a32 32 0 0 1-64 0V437.333333z',
            onclick: (e) =>{
              that.delete(that)
            }
          },
        }
        this.chart.setOption(this.option)
        this.chart.on('click', function(params) {
          that.parent.chartClickEvent(params)
        });
    }

    applyConfig(){
      this.option['title']['text'] = this.config.desc.value
      this.chart.setOption(this.option)
      this.parent.applyChartConfig(this.uid, this.config.desc.value)
    }

    exportExcel(){
      var res = {}
      var item = {}
      Object.keys(this.selectedLines).forEach((line) => {
        if(!line.includes('.highlight.')){
          item[line] = null
        }
      })
      Object.keys(item).forEach((line) => {
        this.selectedLines[line].forEach((e) => {
          var tmp = {}
          tmp['timestamp'] = e.timestamp
          Object.keys(item).forEach((k) => {
            tmp[k] = null
          })
          if (e.global_index in res){
            tmp = res[e.global_index]
          }
          tmp[line] = e.value
          res[e.global_index] = tmp
        })
      })
      // var nums = Object.keys(res).map(v => {return parseInt(v)}).sort()
      var exportData = []
      Object.keys(res).forEach((num) => {
        exportData.push(res[num])
      })
      let csvContent = "timestamp,"+Object.keys(item).join(",")+"\n"
      exportData.forEach(row => {
        csvContent += Object.values(row).join(',') + '\n'
      })
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' })
      const objUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', objUrl)
      link.setAttribute('download', 'export.csv')
      link.click()
    }
}

export {SequentialChart}