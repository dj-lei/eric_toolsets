import * as echarts from 'echarts'
import { Component } from './element'

class Chart extends Component
{
	constructor(position){
		super(position)
		this.chart = ''
		this.setChartDartTheme(echarts)
		this.container.style.display = "inline-block"
		this.container.style.height = '100%'
		this.container.style.border = '1px solid #888'
		this.container.style.backgroundColor = '#555'

		var ch = this.createElementDiv()
		ch.style.width = '99%'
		ch.style.height = '100%'
		ch.style.borderSpacing = 0
		ch.style.border = '1px solid rgb(255, 255, 255)'

		this.bottomBtnSets = this.createElementDiv()
		this.bottomBtnSets.style.position = 'fixed'
		this.bottomBtnSets.style.bottom = 0
		this.bottomBtnSets.style.width = '100%'
		this.container.append(this.bottomBtnSets)

		this.container.append(ch)
		this.container.append(this.bottomBtnSets)

		this.chart = echarts.init(ch, 'dark')
	}

	setChartDartTheme(echarts){
		var contrastColor = '#eee';
		var axisCommon = function () {
				return {
						axisLine: {
								lineStyle: {
										color: contrastColor
								}
						},
						axisTick: {
								lineStyle: {
										color: contrastColor
								}
						},
						axisLabel: {
								textStyle: {
										color: contrastColor
								}
						},
						splitLine: {
								lineStyle: {
										type: 'dashed',
										color: '#aaa'
								}
						},
						splitArea: {
								areaStyle: {
										color: contrastColor
								}
						}
				};
		};

		var colorPalette = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42'];
		var theme = {
				color: colorPalette,
				backgroundColor: '#333',
				tooltip: {
						axisPointer: {
								lineStyle: {
										color: contrastColor
								},
								crossStyle: {
										color: contrastColor
								}
						}
				},
				legend: {
						textStyle: {
								color: contrastColor
						}
				},
				textStyle: {
						color: contrastColor
				},
				title: {
						textStyle: {
								color: contrastColor
						}
				},
				toolbox: {
						iconStyle: {
								normal: {
										borderColor: contrastColor
								}
						}
				},
				dataZoom: {
						textStyle: {
								color: contrastColor
						}
				},
				timeline: {
						lineStyle: {
								color: contrastColor
						},
						itemStyle: {
								normal: {
										color: colorPalette[1]
								}
						},
						label: {
								normal: {
										textStyle: {
												color: contrastColor
										}
								}
						},
						controlStyle: {
								normal: {
										color: contrastColor,
										borderColor: contrastColor
								}
						}
				},
				timeAxis: axisCommon(),
				logAxis: axisCommon(),
				valueAxis: axisCommon(),
				categoryAxis: axisCommon(),
				line: {
						symbol: 'circle',
				},
				graph: {
						color: colorPalette
				},
				gauge: {
						title: {
								textStyle: {
										color: contrastColor
								}
						}
				},
				candlestick: {
						itemStyle: {
								normal: {
										color: '#FD1050',
										color0: '#0CF49B',
										borderColor: '#FD1050',
										borderColor0: '#0CF49B'
								}
						}
				}
		};
		theme.categoryAxis.splitLine.show = false;
		echarts.registerTheme('dark', theme);
	}
}

class SequentialChart extends Chart
{
	constructor(position){
		super(position)
		this.option = this.getSequentialChartConfig()
		this.option['title']['text'] = 'SequentialChart'
		this.option['xAxis']['type'] = 'value'
		this.option['yAxis'] = []
		this.option['series'] = []

		this.yAxisIndex = 0
		this.offsetUnit = 30
		this.selectedLines = {}
		this.legend = []
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

	setLine(legend, line){
		var d = []
		// if (this.selectedLines[line][0].type == 'STRING'){
		//     var values = []
		//     this.selectedLines[line].forEach((item) => {
		//         values.push(item.value)
		//     })
		//     var categories = common.arrayDuplicates(values)
		// }
		// config yaxis
		this.option['yAxis'].push({
			axisLabel: {
					textStyle:{
					fontSize: "8"
					},
			},
			type: line[0].type == 'STRING' ? 'category' : 'value',
			name: legend,
			nameTextStyle: {
					fontSize:'8',
					padding:[0, 0, -7 * this.offsetUnit, 0],
			},
			position: this.yAxisIndex % 2 == 0 ? 'left' : 'right', // left or right
			offset: 30 * this.offsetUnit,
			data: line[0].type == 'STRING' ? categories : null
		})

		// package xaxis data
		line.forEach((dot) => {
			d.push({'value': [dot.graph_index, dot.value], 'globalIndex':dot.global_index, 'searchIndex':dot.search_index, 'origin':dot.value, 'timestamp':dot.timestamp})
		})

		this.option['series'].push(
			{
				name: legend,
				type: 'line',
				yAxisIndex: this.yAxisIndex,
				showSymbol: false,
				data: d,
			}
		)
		this.yAxisIndex = this.yAxisIndex + 1
		this.legend.push(legend)
	}

	setMarkLine(name, legend, line){
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
		line.forEach((dot) => {
			markLine['data'].push({'xAxis': parseInt(dot.graph_index), 'label': {'color': dot.value, 'formatter':dot.name, 'fontSize':10}})
		})

		this.option['series'].push(
			{
				name: name,
				type: 'line',
				showSymbol: false,
				// data: makeLineAxis,
				markLine: markLine
			}
		)
		this.legend.push(legend)
	}

	setTooltip(){
		this.option['tooltip']['formatter'] = function(params){
			var ret = ''
			params.forEach((param) => {
				ret = ret + param.marker + param.data.timestamp +'<br/>'+ "&nbsp;&nbsp;&nbsp;&nbsp;" + param.seriesName + ":" + param.data.origin + '<br/>'
			})
			return ret;
		}
	}

	drawLines(){
		let that = this
		// package line

		if (Object.keys(this.selectedLines).length == 0) {
			this.option['yAxis'] = [{'type':'value'}]
		}
		Object.keys(this.selectedLines).forEach((line) => {
			if (this.selectedLines[line].length > 0){
				if (this.selectedLines[line][0].type == 'mark'){
					this.setMarkLine(this.selectedLines[line][0].name, `${this.selectedLines[line][0].search_alias}.${this.selectedLines[line][0].name}`,this.selectedLines[line])
				}else{
					this.setLine(`${this.selectedLines[line][0].search_alias}.${this.selectedLines[line][0].name}`, this.selectedLines[line])
				}
			}
		})
	}

	refresh(lines){
		this.selectedLines = lines
		this.drawLines()
		this.setTooltip()
		this.option['legend']['data'] = this.legend
		this.chart.setOption(this.option)
	}
}

class FileContainerComponentCompareGraphSequentialChart extends SequentialChart
{
	constructor(fileContainerComponentRegisterCompareGraphDialog, container){
		super(container)
		this.fileContainerComponentRegisterCompareGraphDialog = fileContainerComponentRegisterCompareGraphDialog
	}

	refresh(lines){
		super.refresh(lines)
		this.bindChartClickEvent()
	}

	bindChartDataZoomEvent(){
		let that = this
		var res = []
		// bind click event and paint
		this.chart.on('dataZoom', function(params) {
			console.log(params)
			if (this.fileContainerComponentRegisterCompareGraphDialog.markAlias != '') {
				var startDot = 0
				var endDot = 0
				if ('batch' in params) {
					startDot = params.batch.start
					endDot = params.batch.end
				}else{
					startDot = params.start
					endDot = params.end
				}
				that.option['series'].forEach(line => {
					if((line.type == 'line') & (line.name in that.selectedLegend))
					{
						res.push(line.name)
					}
				})
			}

			that.fileContainerComponentRegisterCompareGraphDialog.update()
		});
	}

	bindChartClickEvent(){
		let that = this

		// bind click event and paint
		this.chart.on('click', function(params) { 
			console.log(params)
			// var startRateDot = 0
			// var endRateDot = 0
			// if ('batch' in params) {
			// 	startRateDot = params.batch.start
			// 	endRateDot = params.batch.end
			// }else{
			// 	startRateDot = params.batch.start
			// 	endRateDot = params.batch.end
			// }
			that.fileContainerComponentRegisterCompareGraphDialog.update()
		});
	}
}

class ChartAtomComponentSequentialChart extends SequentialChart
{
	constructor(chartAtomView){
		super(chartAtomView.container)
		this.chartAtomView = chartAtomView
	}

	refresh(lines){
		super.refresh(lines)
		this.setToolBox()
		this.chart.setOption(this.option)
		this.bindChartClickEvent()
	}

	bindChartClickEvent(){
		let that = this

		// bind click event and paint
		this.chart.on('click', function(params) { 
			console.log(params)
		});
	}

	setToolBox(){
		let that = this
		this.option['toolbox']['right'] = "3%"
		this.option['toolbox']['feature'] = {
			myTool5:{
				show:true,
				title: 'Register',
				icon: 'path://M499.2 281.6l243.2 243.2L413.866667 853.333333H170.666667v-243.2l328.533333-328.533333z m0 123.733333L256 648.533333V768h119.466667l243.2-243.2-119.466667-119.466667zM614.4 170.666667L853.333333 413.866667l-72.533333 72.533333-243.2-243.2L614.4 170.666667z',
				onclick: (e) =>{
					that.chartAtomView.onDisplayCompareGraphDialog(that.chartAtomView.model)
				}
			},
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
					that.chartAtomView.onDelete()
				}
			},
		}
	}

	jump(params){

	}

	// applyConfig(){
	//   this.option['title']['text'] = this.config.desc.value
	//   this.chart.setOption(this.option)
	//   this.parent.applyChartConfig(this.uid, this.config.desc.value)
	// }
}

export {FileContainerComponentCompareGraphSequentialChart, ChartAtomComponentSequentialChart}