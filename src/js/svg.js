import * as d3 from "d3"
import common from '@/plugins/common'
import { Component } from './element'
import { Dialog } from './dialog'

const color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
'#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']

class svg extends Component
{
    constructor(position, scaleMin=0.2, scaleMax=3){
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

    update(data){
        this.data = data

        this.svg.selectAll("*").remove()
        this.draw()
    }

    clear(){
        this.svg.selectAll("*").remove()
    }
}

class svgElement
{
    constructor(svg){
        this.svg = svg.append("g")
    }
}

class Tree extends svg
{
    constructor(container){
        super(container)
        this.data = {}
    }

    clear(){
        super.clear()
        // this.iterationClear([this.data])
        // this.draw(this.data)
    }

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

class IndentedTree extends svgElement
{
    constructor(svg, d){
        super(svg)

        this.d = d
        const nodes = this.d.descendants()
        const link = this.svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#999")
            .selectAll("path")
            .data(this.d.links())
            .join("path")
            .attr("d", d => `
                M${d.source.sx},${d.source.sy}
                V${d.target.sy}
                h${d.target.sx-d.source.sx}
            `);

        const node = this.svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("id", d => d.id)
            .attr("transform", d => `translate(${d.sx},${d.sy})`);

        node.append("circle")
            // .attr("cx", d => d.depth * nodeSize)
            .attr("r", 2.5)
            .attr("fill", d => d.children ? null : "#999");

        const text = node.append("text")
            .attr("dy", "-0.2em")
            // .attr("x", d => d.depth * nodeSize + 6)
            .text(d => d.data.name)
            .attr("stroke", "white")
            .attr("fill", "white")
            .on("click", function(event, d) {
                console.log(d)
            })
            .style("cursor", "pointer")

        text.each(function() {
            var textWidth = this.getComputedTextLength(); // 获取文本宽度
            d3.select(this)
                .attr("transform", "translate(" + -1 * textWidth + ", 0)");
        })
    }
}

class LineChart extends svgElement
{
    constructor(svg, d){
        super(svg)

        this.d = d

        Object.keys(d.data.data.select_lines).forEach((name, index) =>{
            if (d.data.data.select_lines[name][0].type == 'mark') {
                this.addMark(d.data.data.select_lines[name], d.height)
            }else{
                this.addLine(d.data.data.select_lines[name], name, d.height, index)
            }
        })
    }

    addLine(line, name, height, index){
        var y = d3.scaleLinear().range([height, 0])
        y.domain(d3.extent(line, function (d) { return d.value }))

        var lineF = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return y(d.value) })
        .curve(d3.curveLinear)

        // add x axis
        // this.svg.append("g")
        // .attr("transform", "translate(0," + height + ")")
        // .call(d3.axisBottom(x))
        // .select(".domain")
        // .remove()

        // add y axis
        this.svg.append("g")
            .attr("transform", `translate(${(index * -50) - 20},0)`)
            .call(d3.axisLeft(y))
            .append("text")
            .attr("fill", "#000")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.4em")
            .attr("text-anchor", "end")
            .text(name)
            .attr("stroke", color[index])
            .attr("fill", color[index])

        const node = this.svg.append("g")

        // add path elm
        const path = node.append("path")
                        .datum(line)
                        .attr("fill", "none")
                        .attr("stroke", color[index])
                        .attr("stroke-linejoin", "round")
                        .attr("stroke-linecap", "round")
                        .attr("stroke-width", 2)
                        .attr("stroke-dasharray", "10 10")
                        .attr("d", lineF);

        const points = node.selectAll("circle")
                        .data(line)
                        
        points.enter()
            .append("circle")
            .attr("r", 3)
            .attr("fill", color[index])
            .attr("cx", d => d.x)
            .attr("cy", d => y(d.value))
            .on("click", function(event, d) {
                console.log(d)
            })
            .style("cursor", "pointer")
    }

    addMark(mark, height){
        const node = this.svg.append("g")
                    .selectAll("g")
                    .data(mark)
                    .join("g")

        node.append("line")
            .attr("x1", d => d.x)
            .attr("y1", 0)
            .attr("x2", d => d.x)
            .attr("y2", height)
            .attr("stroke", d => d.value)
            .attr("stroke-width", 3)

        node.append("text")
            .attr("x", d => d.x)
            .attr("y", 0)
            .attr("stroke", d => d.value)
            .attr("fill", d => d.value)
            .text(d => d.name)
            .on("click", function(event, d) {
                console.log(d)
            })
            .style("cursor", "pointer")
    }
}

class LineStory extends svgElement
{
    constructor(svg, d){
        super(svg)

        this.d = d
        console.log(d)
        this.svg.append("rect")
            .attr("x", 0)
            .attr("height", d.height)
            .attr("width", d.ex - d.sx)
            .attr("fill", "#FFFFFF")
    }
}

class TextFileOriginalComponentSvg extends svg
{
    constructor(textFileOriginalView){
        super(textFileOriginalView.container)
        this.viewMode = 'global'
        this.startPosition = 0
        this.endPosition = 0
        this.viewWidth = 5000
        this.currentHeight = 0
        this.lineChartHeight = 200
        this.lineStoryHeight = 20
        this.intervalHeight = 10
    }

    update(data){
        this.clear()
        this.currentHeight = 0
        this.data = data
        this.svg.style("overflow", "visible")
        
        // get boundary
        var starts = []
        var ends = []
        d3.hierarchy(this.data).eachBefore(d => {
            if (d.data.data != null) {
                if (this.viewMode == 'timestamp') {
                    starts.push(d.data.data.start_timestamp)
                    ends.push(d.data.data.end_timestamp)
                }else{
                    starts.push(d.data.data.start_global_index)
                    ends.push(d.data.data.end_global_index)
                }
            }
        })

        var x = d3.scaleLinear().range([0, this.viewWidth])
        x.domain(d3.extent(starts.concat(ends)))
        this.svg.append("g")
        .attr("transform", "translate(0,0)")
        .call(d3.axisBottom(x))
        // .select(".domain")
        // .remove()

        // map x y
        var i = 0
        var root = d3.hierarchy(this.data).eachBefore(d => {
            d.id = d.data.name
            d.index = i++
            d.sy = this.currentHeight

            if (d.data.data == null) {
                d.sx = 0
                d.height = this.lineStoryHeight
                this.currentHeight = this.currentHeight + this.lineStoryHeight + this.intervalHeight
            }else{
                if (this.viewMode == 'timestamp') {
                    d.sx = x(d.data.data.start_timestamp)
                    d.ex = x(d.data.data.end_timestamp)
                }else{
                    d.sx = x(d.data.data.start_global_index)
                    d.ex = x(d.data.data.end_global_index)
                }

                if (d.data.data.type == 'chart') {
                    var chartX = d3.scaleLinear().range([0, d.ex - d.sx])
                    chartX.domain([d.sx, d.ex])

                    // convert timestamp or global_index to x
                    Object.keys(d.data.data.select_lines).forEach((name) =>{
                        d.data.data.select_lines[name].forEach(dot => {
                            if (this.viewMode == 'timestamp') {
                                dot.x = chartX(x(dot.timestamp))
                            }else{
                                dot.x = chartX(x(dot.global_index))
                            }
                        })
                    })
                    d.height = this.lineChartHeight
                    this.currentHeight = this.currentHeight + this.lineChartHeight + this.intervalHeight
                }else if(d.data.data.type == 'search'){
                    d.height = this.lineStoryHeight
                    this.currentHeight = this.currentHeight + this.lineStoryHeight + this.intervalHeight
                }
            }
        
        })

        const nodes = root.descendants()
        new IndentedTree(this.svg, root)
        nodes.forEach(d => {
            if (d.data.data != null){
                if (d.data.data.type == 'chart') {
                    new LineChart(this.svg.select(`#${d.id}`), d)
                }else if(d.data.data.type == 'search'){
                    new LineStory(this.svg.select(`#${d.id}`), d)
                }
            }
        })
        console.log(this.svg.node())
    }
}

class ChartAtomComponentSvgDialog extends Dialog
{
    constructor(chartAtomView){
        super(chartAtomView.container)
        this.chartAtomView = chartAtomView
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`

        this.subContainer.appendChild(this.createElementHr())
        // identifier
        this.identifier = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Identifier(Global Unique)'))
        this.subContainer.appendChild(this.identifier)
        this.subContainer.appendChild(this.createElementHr())

        // search description
        this.desc = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Graph Description'))
        this.subContainer.appendChild(this.desc)
        this.subContainer.appendChild(this.createElementHr())

        // name
        this.parentRole = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Parent Role, for story lines and hierarchy diagrams (Optional)'))
        this.subContainer.appendChild(this.parentRole)
        this.subContainer.appendChild(this.createElementHr())

        this.subContainer.appendChild(this.createElementHeader('Key Value Tree'))
        this.chartAtomComponentSvg = new ChartAtomComponentSvg(this)
    }

    apply(){
        let model = {
            namespace: this.chartAtomView.namespace,
            identifier: this.identifier.value,
            desc: this.desc.value,
            key_value_tree: this.chartAtomComponentSvg.data,
            parent_role: this.parentRole.value,
        }
        this.chartAtomView.controlExec(model)
    }

    update(model){
        this.identifier.value = model.identifier
        this.desc.value = model.desc
        this.chartAtomComponentSvg.update(model.key_value_tree)
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
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.float = 'right'
        this.cancel.onclick = function(){dialog.hidden()}
        this.clear = this.createElementButton('CLEAR')
        this.clear.style.backgroundColor = 'blue'
        this.clear.style.float = 'right'
        this.clear.onclick = function(){dialog.clear()}
        this.apply = this.createElementButton('APPLY')
        this.apply.style.backgroundColor = 'green'
        this.apply.style.float = 'right'
        this.apply.onclick = function(){dialog.apply()}
        this.bottomBtnSets.appendChild(this.cancel)
        this.bottomBtnSets.appendChild(this.clear)
        this.bottomBtnSets.appendChild(this.apply)
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

class BatchInsightComponentSvgDialog extends Dialog
{
    constructor(batchInsightView){
        super(batchInsightView.container)
        this.batchInsightView = batchInsightView
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`

        this.batchInsightComponentSvg = new BatchInsightComponentSvg(this)
    }

    clear(){
        this.batchInsightComponentSvg.clear()
    }

    refresh(data){
        this.batchInsightComponentSvg.update(data)
    }
}

class BatchInsightComponentSvg extends Tree
{
    constructor(batchInsightComponentSvgDialog){
        super(batchInsightComponentSvgDialog.subContainer)
        this.batchInsightComponentSvgDialog = batchInsightComponentSvgDialog
        
        let that = this
        var cancelBtn = this.createElementButton('CANCEL')
        cancelBtn.style.backgroundColor = 'red'
        cancelBtn.style.float = 'right'
        cancelBtn.onclick = function(){that.batchInsightComponentSvgDialog.hidden()}
        this.bottomBtnSets.appendChild(cancelBtn)
    }

    clickEvent(event, d){
        if (d.depth == 1) {
            this.batchInsightComponentSvgDialog.batchInsightView.controlGetUniversal(parseInt(d.data.name[d.data.name.length - 1]) )
        }else if(d.depth == 2){
            this.batchInsightComponentSvgDialog.batchInsightView.controlGetSingleInsight(d.data.namespace)
        }
    }

}

class GlobalChartComponentSvgDialog extends Dialog
{
    constructor(globalChartView){
        super(globalChartView.container)
        this.globalChartView = globalChartView
        
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 150}px`

        this.globalChartComponentSvg = new GlobalChartComponentSvg(this)
    }

    apply(){
        let model = {
            namespace: this.globalChartView.namespace,
            name: "global",
            key_value_tree: this.globalChartView.model.key_value_tree,
        }
        this.globalChartView.controlExec(model)
    }

    update(model){
        this.globalChartComponentSvg.update(model.key_value_tree)
    }

    clear(){
        this.globalChartView.controlClearKeyValueTree()
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

export {TextFileOriginalComponentSvg, BatchInsightComponentSvgDialog, ChartAtomComponentSvgDialog, GlobalChartComponentSvgDialog}