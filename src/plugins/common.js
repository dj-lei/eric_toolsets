export default {
    setBrowserTitle(val){
      document.title = val
    },

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
    },

    getChartConfig(){
      return {
        title: {
          text: 'Stacked Line'
        },
        // backgroundColor:'#3F3F3F',
        toolbox:{
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
            
          },
          // feature: {
          //   saveAsImage: {
          //     show: true,
          //     excludeComponents: ['toolbox'],
          //     pixelRatio: 2
          //   }
          // }
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
    },

    zip(x, y){
      return Array(Math.max(x.length, y.length)).fill().map((_,i) => [x[i], y[i]]);
    },

    removeAll(dom){
      this.removeAllChild(dom)
      dom.parentNode.removeChild(dom)
    },

    removeAllChild(dom){
      while (dom.firstChild) {
        dom.removeChild(dom.lastChild)
      }
    },

    removeAllChildDom(id){
      var divGraphs = document.getElementById(id)
      while (divGraphs.firstChild) {
        divGraphs.removeChild(divGraphs.lastChild)
      }
    },

    arrayRemoveElm(list, elm){
      const index = list.indexOf(elm);
      if (index > -1) { // only splice array when item is found
        list.splice(index, 1); // 2nd parameter means remove one item only
      }
    },

    arrayIntersection(a, b){
      return a.filter(value => b.includes(value))
    },

    arrayDuplicates(a){
      return Array.from(new Set(a))
    },

    arrayExtend(a, b){
      Array.prototype.push.apply(a,b)
      return a
    },

    hex2bin(hex){
      var res = (parseInt(hex, 16).toString(2)).padStart(8, '0')
      if (res.length < 32){
        var tmp = 32 - res.length
        for(var i=0;i<tmp;i++){
          res = '0' + res 
        }
      }
      return res;
    },

    exportConfig(filterData, highlightKeyword){
      var res = {}
      res['filterData'] = filterData
      res['highlightKeyword'] = highlightKeyword
      this.exportJosnToLocalTxt(res, 'config.txt')
    },

    loadConfig(){
      document.getElementById('fileInput').click()
    },

    exportJosnToLocalTxt(content, fileName){
      var a = document.createElement("a");
      var file = new Blob([JSON.stringify(content)], {type: 'text/plain'});
      a.href = URL.createObjectURL(file);
      a.download = fileName;
      a.click();
    },

    startLoading(){
      var loadingOverlay = document.querySelector('.loading');
      loadingOverlay.classList.remove('hidden');
    },
    
    stopLoading(){
      var loadingOverlay = document.querySelector('.loading');
      loadingOverlay.classList.add('hidden');
    },
}

