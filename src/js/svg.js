import * as d3 from "d3"
import common from '@/plugins/common'
import { Component } from './element'
import { Dialog } from './dialog'

class svg extends Component
{
    constructor(position, scaleMin, scaleMax){
        super(position)
        this.svg = ''
        this.bottomNav = ''

        this.container.style.width = "100%"
        this.container.style.height = '100%'
        this.container.style.backgroundColor = '#555'
        this.container.style.border = '1px solid #888'

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', '100%')
        this.container.append(svg)

        this.bottomBtnSets = this.createElementDiv()
        this.bottomBtnSets.style.position = 'fixed'
        this.bottomBtnSets.style.bottom = 0
        this.bottomBtnSets.style.width = '50%'
        this.container.append(this.bottomBtnSets)

        var zoom = d3.zoom().scaleExtent([scaleMin, scaleMax]).on("zoom", zoomed)
        d3.select(svg).call(zoom).on("dblclick.zoom", null)

        this.svg = d3.select(svg).append("g")
                    .attr("id", "canvas")
                    .style("font", "12px sans-serif")
                    .append("g")
                        .attr("transform", `translate(${document.body.offsetWidth / 3},${document.body.offsetHeight / 4})`)
    
        function zoomed(event) {
            const {transform} = event
            d3.select(svg).select("#canvas").attr("transform", transform)
        }
    }
}

class Tree extends svg
{
    constructor(container){
        super(container)
        this.data = {}
    }

    update(data){
        this.data = data

        this.svg.selectAll("*").remove()
        this.draw()
    }

    // clear(){
    //     this.iterationClear([this.data])
    //     this.svg.selectAll("*").remove()
    //     this.draw(this.data)
    // }

    // iterationClear(data){
    //     data.forEach((item) => {
    //         if ('children' in item){
    //             this.iterationClear(item['children'])
    //         }else{
    //             item.check = false
    //         }
    //     })
    // }

    draw(){
        let that = this
        const width = 1600
        const dx = 10
        const dy = width / 6
        const margin = ({top: 10, right: 120, bottom: 10, left: 40})
  
        const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)
        const root = d3.hierarchy(this.data);
        const tree = d3.tree().nodeSize([dx, dy])
        
        root.x0 = dy / 2;
        root.y0 = 0;
        
        // root.descendants().forEach((d, i) => {
            // d._children = d.children
            // if (d.depth !== 0) d.children = null
        // })
      
        const gLink = this.svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5);
      
        const gNode = this.svg.append("g")
            .attr("cursor", "pointer")
            .attr("pointer-events", "all");
      
        function update(source) {
          // const duration = d3.event && d3.event.altKey ? 2500 : 250;
          const duration = 250;
          const nodes = root.descendants().reverse();
          const links = root.links();
          // Compute the new tree layout.
          tree(root);
          
          let left = root;
          let right = root;
          root.eachBefore(node => {
            if (node.x < left.x) left = node;
            if (node.x > right.x) right = node;
          });
      
          const height = right.x - left.x + margin.top + margin.bottom;
      
          const transition = that.svg.transition()
              .duration(duration)
              .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
              .tween("resize", window.ResizeObserver ? null : () => () => that.svg.dispatch("toggle"));
      
          // Update the nodes…
          const node = gNode.selectAll("g")
            .data(nodes, d => d.id);
      
          // Enter any new nodes at the parent's previous position.
          const nodeEnter = node.enter().append("g")
              .attr("transform", `translate(${source.y0},${source.x0})`)
            //   .attr("transform", d => `translate(${source.y0},${source.x0})`)
              .attr("fill-opacity", 0)
              .attr("stroke-opacity", 0)
              .on("click", (event, d) => {
                that.clickEvent(event, d)
                // update(d);
                // console.log(that.data)
              });
      
          nodeEnter.append("circle")
              .attr("r", 2.5)
              .attr("id", d => "circle"+String(d.data.id))
              .attr("fill", d => {
                    if (d.data.check == true){
                        return "#33CC00"
                    }
                    if (d._children){
                        return "555"
                    }else{
                        return "#999"
                    }
                })
              .attr("stroke-width", 10);
      
          nodeEnter.append("text")
              .attr("id", d => "text"+String(d.data.id))
              .attr("dy", "0.31em")
              .attr("x", d => d._children ? -6 : 6)
              .attr("text-anchor", d => d._children ? "end" : "start")
              .text(d => d.data.name)
              .attr("stroke-width", 0.5)
              .attr("stroke", d => {
                    if (d.data.check == true){
                        return "#33CC00"
                    }else{
                        return "white"
                    }
                })
              .attr("fill", d => {
                    if (d.data.check == true){
                        return "#33CC00"
                    }else{
                        return "white"
                    }
                });
      
          // Transition nodes to their new position.
          node.merge(nodeEnter).transition(transition)
              .attr("transform", d => `translate(${d.y},${d.x})`)
              .attr("fill-opacity", 1)
              .attr("stroke-opacity", 1);
      
          // Transition exiting nodes to the parent's new position.
          node.exit().transition(transition).remove()
              .attr("transform", `translate(${source.y},${source.x})`)
              .attr("fill-opacity", 0)
              .attr("stroke-opacity", 0);
      
          // Update the links…
          const link = gLink.selectAll("path")
            .data(links, d => d.target.id);
      
          // Enter any new links at the parent's previous position.
          const linkEnter = link.enter().append("path")
              .attr("d", function () {
                const o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
              });
      
          // Transition links to their new position.
          link.merge(linkEnter).transition(transition)
              .attr("d", diagonal);
      
          // Transition exiting nodes to the parent's new position.
          link.exit().transition(transition).remove()
              .attr("d", function () {
                const o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
              });
      
          // Stash the old positions for transition.
          root.eachBefore(d => {
            d.x0 = d.x;
            d.y0 = d.y;
          });
        }
        update(root);
    }
}

class BatchInsightComponentSvgDialog extends Dialog
{
    constructor(batchInsightView){
        super(batchInsightView.container)
        this.batchInsightView = batchInsightView
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`

        this.batchInsightComponentSvg = new BatchInsightComponentSvg(this)
    }
}

class BatchInsightComponentSvg extends Tree
{
    constructor(batchInsightComponentSvgDialog){
        super(batchInsightComponentSvgDialog.subContainer)
        this.batchInsightComponentSvgDialog = batchInsightComponentSvgDialog
        
        var cancelBtn = this.createElementButton('CANCEL')
        cancelBtn.style.backgroundColor = 'red'
        cancelBtn.style.float = 'right'
        cancelBtn.onclick = function(){dialog.hidden()}
        this.bottomBtnSets.appendChild(cancelBtn)
    }

    refresh(data){
        this.data = data
        this.draw(this.data)
    }

    clickEvent(event, d){
        if (d.depth == 1) {
            this.batchInsightComponentSvgDialog.batchInsightView.controlGetUniversal(parseInt(d.data.name[d.data.name.length - 1]) )
        }else if(d.depth == 2){
            this.batchInsightComponentSvgDialog.batchInsightView.controlGetSingleInsight(d.data.namespace)
        }
    }

}

class ChartAtomComponentSvgDialog extends Dialog
{
    constructor(chartAtomView){
        super(chartAtomView.container)
        this.chartAtomView = chartAtomView
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`

        this.alias = ''
        this.desc = ''
        // alias
        this.alias = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Alias(Global Unique)'))
        this.subContainer.appendChild(this.alias)

        // search description
        this.desc = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementH4('Graph Description'))
        this.subContainer.appendChild(this.desc)

        this.chartAtomComponentSvg = new ChartAtomComponentSvg(this)
    }

    apply(){
        let model = {
            namespace: this.chartAtomView.namespace,
            alias: this.alias.value,
            desc: this.desc.value,
            key_value_tree: this.chartAtomComponentSvg.data,
        }
        this.chartAtomView.controlChart(model)
    }

    update(model){
        this.alias.value = model.alias
        this.desc.value = model.desc
        this.chartAtomComponentSvg.update(model.keyValueTree)
    }

    clear(){
        this.chartAtomView.controlClearKeyValueTree()
    }
}

class ChartAtomComponentSvg extends Tree
{
    constructor(dialog){
        super(dialog.subContainer)

        let that = this
        var cancelBtn = this.createElementButton('CANCEL')
        cancelBtn.style.backgroundColor = 'red'
        cancelBtn.style.float = 'right'
        cancelBtn.onclick = function(){dialog.hidden()}
        var clearBtn = this.createElementButton('CLEAR')
        clearBtn.style.backgroundColor = 'blue'
        clearBtn.style.float = 'right'
        clearBtn.onclick = function(){dialog.clear()}
        var applyBtn = this.createElementButton('APPLY')
        applyBtn.style.backgroundColor = 'green'
        applyBtn.style.float = 'right'
        applyBtn.onclick = function(){dialog.apply()}
        this.bottomBtnSets.appendChild(cancelBtn)
        this.bottomBtnSets.appendChild(clearBtn)
        this.bottomBtnSets.appendChild(applyBtn)
    }

    clickEvent(event, d){
        d.children = d.children ? null : d._children;
        if (d._children) {
            return
        }else{
            if (d.data.check == true){
                d.data.check = false
                d3.select(event.target.parentNode).select('circle').attr("fill", "#999")
                d3.select(event.target.parentNode).select('text').attr("fill", "#FFF")
                d3.select(event.target.parentNode).select('text').attr("stroke", "#FFF")
            }else{
                d.data.check = true
                d3.select(event.target.parentNode).select('circle').attr("fill", "#33CC00")
                d3.select(event.target.parentNode).select('text').attr("fill", "#33CC00")
                d3.select(event.target.parentNode).select('text').attr("stroke", "#33CC00")
            }
        }
    }
}

class GlobalChartComponentSvgDialog extends Dialog
{
    constructor(globalChartView){
        super(globalChartView.container)
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`

        this.globalChartComponentSvg = new GlobalChartComponentSvg(this)
    }

    apply(){
        let model = {
            namespace: this.globalChartView.namespace,
            alias: "sss",
            key_value_tree: this.globalChartView.model.keyValueTree,
        }
        this.globalChartView.controlChart(model)
    }
}

class GlobalChartComponentSvg extends Tree
{
    constructor(dialog){
        super(dialog.subContainer)

        let that = this
        var cancelBtn = this.createElementButton('CANCEL')
        cancelBtn.style.backgroundColor = 'red'
        cancelBtn.style.float = 'right'
        cancelBtn.onclick = function(){dialog.hidden()}
        var clearBtn = this.createElementButton('CLEAR')
        clearBtn.style.backgroundColor = 'blue'
        clearBtn.style.float = 'right'
        clearBtn.onclick = function(){that.clear()}
        var applyBtn = this.createElementButton('APPLY')
        applyBtn.style.backgroundColor = 'green'
        applyBtn.style.float = 'right'
        applyBtn.onclick = function(){dialog.apply()}
        this.bottomBtnSets.appendChild(cancelBtn)
        this.bottomBtnSets.appendChild(clearBtn)
        this.bottomBtnSets.appendChild(applyBtn)
    }

    clickEvent(event, d){
        d.children = d.children ? null : d._children;

        if (d._children) {
            return
        }else{
            if (d.data.check == true){
                d.data.check = false
                d3.select(event.target.parentNode).select('circle').attr("fill", "#999")
                d3.select(event.target.parentNode).select('text').attr("fill", "#FFF")
                d3.select(event.target.parentNode).select('text').attr("stroke", "#FFF")
            }else{
                d.data.check = true
                d3.select(event.target.parentNode).select('circle').attr("fill", "#33CC00")
                d3.select(event.target.parentNode).select('text').attr("fill", "#33CC00")
                d3.select(event.target.parentNode).select('text').attr("stroke", "#33CC00")
            }
        }
    }

    refresh(data){
        this.data = data
        this.draw(this.data)
    }
}

export {BatchInsightComponentSvgDialog, ChartAtomComponentSvgDialog, GlobalChartComponentSvgDialog}