import * as echarts from 'echarts'
import common from '@/plugins/common'

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
        this.canvas.style.display = "block"
        this.canvas.style.width = '100%'
        this.canvas.style.height = '100%'
        this.canvas.style.border = '1px solid #888'
        this.canvas.style.backgroundColor = '#555'

        var ch = document.createElement('div')
        ch.style.width = '100%'
        ch.style.height = '100%'

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
          // toolbox:{
          //   feature:{
          //   }
          // },
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
              
            },
            feature: {
              saveAsImage: {
                show: true,
                excludeComponents: ['toolbox'],
                pixelRatio: 2
              }
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
        that.canvas.style.display = "none"
    }

    delete(){
      common.removeAll(this.canvas)
    }
}

class SequentialChart extends Chart
{
    constructor(parent, selectedLine, position){
        super()
        this.parent = parent
        this.register(position)
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
        var option = this.getSequentialChartConfig()
        option['title']['text'] = "Sequential"
        option['yAxis'] = []
        option['series'] = []
        var yAxisIndex = 0
        var legend = []
        var leftYAxis = []
        var rightYAxis = []

        if (Object.keys(this.selectedLines).length == 0) {
            option['yAxis'] = [{'type':'value'}]
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
                option['series'].push(
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
                option['yAxis'].push({
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
                
                option['series'].push(
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
  
        option['tooltip']['formatter'] = function(params){
            var ret = ''
            params.forEach((param) => {
                ret = ret + param.marker + param.data.timestamp +'<br/>'+ "&nbsp;&nbsp;&nbsp;&nbsp;" + param.seriesName + ":" + param.data.origin + '<br/>'
            })
            return ret;
        }
        
        // bind click event and paint
        option['legend']['data'] = legend
        option['xAxis']['type'] = 'value'
        // install tool button 
        // option['toolbox']['feature'] = {
        //   myTool1:{
        //     show:true,
        //     title: 'Zoom Out',
        //     icon: 'path://M395.731085 571.196755l10.18176 10.18176q4.072704 4.072704 8.145408 7.63632t8.145408 7.63632l12.218112 12.218112q20.363521 20.363521 16.290817 35.636161t-25.454401 35.636161q-9.163584 10.18176-30.036193 31.054369t-44.799745 45.308833-46.32701 46.836098-34.617985 35.636161q-18.327169 18.327169-25.454401 32.072545t6.109056 26.981665q9.163584 9.163584 23.418049 24.436225t24.436225 25.454401q17.308993 17.308993 12.7272 30.545281t-30.036193 15.27264q-26.472577 3.054528-59.05421 7.127232t-67.199618 7.63632-67.708706 7.63632-60.581474 7.127232q-26.472577 3.054528-36.654337-6.618144t-8.145408-34.108897q2.036352-25.454401 5.599968-57.017858t7.63632-64.654178 7.63632-65.672354 6.618144-60.072386q3.054528-29.527105 16.799905-37.672513t31.054369 9.163584q10.18176 10.18176 26.472577 24.945313t27.490753 25.963489 21.381697 7.127232 23.418049-16.290817q13.236288-13.236288 36.145249-36.654337t47.854274-48.363362 48.363362-48.87245 37.672513-38.181601q6.109056-6.109056 13.745376-11.709024t16.799905-7.63632 18.836257 1.018176 20.872609 13.236288zM910.928158 58.036034q26.472577-3.054528 36.654337 6.618144t8.145408 34.108897q-2.036352 25.454401-5.599968 57.017858t-7.63632 64.654178-7.63632 66.181442-6.618144 60.581474q-3.054528 29.527105-16.799905 37.163425t-31.054369-9.672672q-10.18176-10.18176-27.999841-26.472577t-29.018017-27.490753-19.345345-9.672672-20.363521 13.745376q-14.254464 14.254464-37.163425 37.672513t-48.363362 49.381538-49.890626 50.399714l-37.672513 37.672513q-6.109056 6.109056-13.236288 12.218112t-15.781729 9.163584-18.327169 1.018176-19.854433-13.236288l-38.690689-38.690689q-20.363521-20.363521-17.818081-37.163425t22.908961-37.163425q9.163584-9.163584 30.545281-31.054369t45.817921-46.32701 47.345186-47.854274 36.145249-35.636161q18.327169-18.327169 22.908961-30.036193t-8.654496-24.945313q-9.163584-9.163584-21.890785-22.399873t-22.908961-23.418049q-17.308993-17.308993-12.7272-30.545281t30.036193-16.290817 58.545122-7.127232 67.708706-7.63632 67.708706-7.63632 60.581474-7.127232z',
        //     onclick: (e) =>{
        //       if(that.isGraphFullScreen == false){
        //         document.getElementById("log-detail-standard-zoom-btn").style.display = "none"
        //         document.getElementById("Sequential").setAttribute('style', `width:${document.body.offsetWidth}px;height:${that.graphHeight}px;`)
        //         chart.resize({height:that.graphHeight, width:document.body.offsetWidth})
                
        //         that.isGraphFullScreen = true
        //         document.getElementById("graph-detail-standard").style.left = "0%"
        //         document.getElementById("graph-detail-standard").style.width = "100%"
        //       }else{
        //         document.getElementById("log-detail-standard-zoom-btn").style.display = "block"
        //         document.getElementById("Sequential").setAttribute('style', `width:${document.body.offsetWidth / 2}px;height:${that.graphHeight}px;`)
        //         chart.resize({height:that.graphHeight, width:document.body.offsetWidth / 2})
   
        //         that.isGraphFullScreen = false
        //         document.getElementById("graph-detail-standard").style.left = "50%"
        //         document.getElementById("graph-detail-standard").style.width = "50%"
        //         document.getElementById("log-detail-standard").style.width = "50%"
        //       }
  
        //     }
        //   },
        //   myTool2:{
        //     show:true,
        //     title: 'Edit',
        //     icon: 'path://M499.2 281.6l243.2 243.2L413.866667 853.333333H170.666667v-243.2l328.533333-328.533333z m0 123.733333L256 648.533333V768h119.466667l243.2-243.2-119.466667-119.466667zM614.4 170.666667L853.333333 413.866667l-72.533333 72.533333-243.2-243.2L614.4 170.666667z',
        //     onclick: (e) =>{
        //       var modal = document.getElementById("legend-config-modal")
        //       modal.style.display = "block"
        //     }
        //   },
        //   myTool3:{
        //     show:true,
        //     title: 'Export',
        //     icon: 'path://M712.533333 371.2l-128 128-59.733333-59.733333 128-128L597.333333 256l-42.666666-42.666667h256v256l-42.666667-42.666666-55.466667-55.466667zM657.066667 256H768v110.933333V256h-110.933333zM298.666667 298.666667v426.666666h426.666666v-256l85.333334 85.333334v256H213.333333V213.333333h256l85.333334 85.333334H298.666667z',
        //     onclick: (e) =>{
        //       that.exportExcel()
        //     }
        //   },
  
        // }
        this.chart.setOption(option)
        this.chart.on('click', function(params) {
          that.parent.chartClickEvent(params)
        });
        // this.chart.on('legendselectchanged', function(params){
        // //   that.selectedLinesOnGraph = params.selected
        // });
    }
}

export {SequentialChart}