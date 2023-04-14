import * as d3 from "d3"
import common from '@/plugins/common'
import { Component } from './element'
import { Dialog } from './dialog'
import { TextFileOriginalComponentSvgNavigate, TextFileCompareComponentSvgDialogNavigate, ChartAtomComponentLineChartNavigate } from './navigate'
import { tickFormat } from "d3"

const color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
'#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']

class svg extends Component
{
    constructor(position, scaleMin=0.2, scaleMax=3){
        super(position)
        this.svg = ''
        this.scaleMin = scaleMin
        this.scaleMax = scaleMax

        this.container.style.width = "100%"
        this.container.style.height = '100%'
        this.container.style.backgroundColor = '#000'
        this.container.style.border = '1px solid #888'

        this.svgElm = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        this.svgElm.setAttribute('width', '100%')
        this.svgElm.setAttribute('height', '100%')
        this.container.append(this.svgElm)

        this.svg = d3.select(this.svgElm).append("g")
                    .attr("id", "canvas")
                    .style("font", "12px sans-serif")
                    .append("g")
                        // .attr("transform", `translate(${document.body.offsetWidth / 3},${document.body.offsetHeight / 4})`)
    
        var zoom = d3.zoom().scaleExtent([this.scaleMin, this.scaleMax]).on("zoom", zoomed)
        d3.select(this.svgElm).call(zoom).on("dblclick.zoom", null)

        let that = this
        function zoomed(event) {
            const {transform} = event
            d3.select(that.svgElm).select("#canvas").attr("transform", transform)
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

class XAxis extends svgElement
{
    constructor(svg, pixelWidth, lowerBound, upperBound, tickFormatFunc=null){
        super(svg)

        this.pixelWidth = pixelWidth
        this.lowerBound = lowerBound
        this.upperBound = upperBound
        this.tickFormatFunc = tickFormatFunc
        this.x = d3.scaleLinear().range([0, pixelWidth])
        this.x.domain([lowerBound, upperBound])
        this.svg.attr("transform", "translate(0,10)")
        this.svg.call(this.updateXAxis, this.x, {'k': 1}, this.tickFormatFunc)
    }

    updateXAxis(g, x, transform, func){
        var xA = d3.axisBottom(x).ticks(8 * transform.k)
        g.call(xA.tickFormat(function(d) {
                        if (func) {
                            return common[func](d)
                        }else{
                            return d
                        }
                    }))
                .style('stroke', "#FFF")
                .select(".domain")
                .style('stroke', "#FFF")
        g.selectAll('.tick line').style('stroke', "#FFF")
    }
}

class TidyTree extends svgElement
{
    constructor(svg, data){
        super(svg)
        this.nodeEnter = ''
        this.data = data
        this.draw()
    }

    // clear(){
    //     this.svg.selectAll("*").remove()
    //     // this.iterationClear([this.data])
    //     // this.draw(this.data)
    // }

    // update(data){
    //     this.clear()
    //     this.data = data
    //     this.draw()
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
            that.nodeEnter = node.enter().append("g")
                .attr("transform", `translate(${source.y0},${source.x0})`)
            //   .attr("transform", d => `translate(${source.y0},${source.x0})`)
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0)
      
            that.nodeEnter.append("circle")
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
      
            that.nodeEnter.append("text")
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
            node.merge(that.nodeEnter).transition(transition)
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
    constructor(svg, data){
        super(svg)
        this.data = d3.hierarchy(data)
        const nodes = this.data.descendants()

        const link = this.svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#999")
            .selectAll("path")
            .data(this.data.links())
            .join("path")
            .attr("d", d => {
                var p = `
                        M${d.source.data.data.sx},${d.source.data.data.sy}
                        V${d.target.data.data.sy}
                        h${d.target.data.data.sx-d.source.data.data.sx}
                    `
                return p
            });

        const node = this.svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .attr("id", d => {
                return d.data.data.id
            })
            .attr("transform", d => `translate(${d.data.data.sx},${d.data.data.sy})`);

        node.append("circle")
            // .attr("cx", d => d.depth * nodeSize)
            .attr("r", 2.5)
            .attr("fill", d => d.children ? null : "#999");

        const text = node.append("text")
            .attr("dy", "-0.2em")
            // .attr("x", d => d.depth * nodeSize + 6)
            .text(d => {
                return d.data.name.split('.')[d.data.name.split('.').length - 1]
            })
            .attr("stroke", "white")
            .attr("fill", "white")
            .style("cursor", "pointer")
            .on("click", function(event, d) {
                // Check if the node has children
                if (d.children) {
                    // Hide all children
                    d.children.forEach((child) => {
                        child.data.hidden = true;
                    });
                } else {
                    // If the node doesn't have children, do nothing
                    return;
                }

                // Update the display of all nodes
                node.each(function (node) {
                    d3.select(this)
                        .style("display", node.data.hidden ? "none" : "inherit");
                });
            })
            
        text.each(function() {
            var textWidth = this.getComputedTextLength();
            // d3.select(this)
            //     .attr("transform", "translate(" + -1 * textWidth + ", 0)");
        })
    }
}

class LineChart extends svgElement
{
    constructor(svg, data, lineType, width, height){
        super(svg)
        this.width = width
        this.data = data
        this.lineType = lineType
        this.points = []

        this.svg.append("line")
            .attr("x1", 0)
            .attr("y1", height)
            .attr("x2", width)
            .attr("y2", height)
            .attr("stroke", "white")
            .attr("stroke-width", "1");

        Object.keys(this.data).forEach((name, index) =>{
            if (this.data[name][0].type == 'mark') {
                this.addMark(this.data[name], height)
            }else{
                this.addLine(this.data[name], name, height, index)
            }
        })
    }

    addLine(line, name, height, index){
        var y = d3.scaleLinear().range([height, 0])
        y.domain(d3.extent(line, function (d) { return d.y }))

        var lineF = d3.line()
        .x(function (d) { return d.x })
        .y(function (d) { return y(d.y) })
        .curve(d3.curveLinear)

        // add x axis
        // this.svg.append("g")
        // .attr("transform", "translate(0," + height + ")")
        // .call(d3.axisBottom(x))
        // .select(".domain")
        // .remove()

        // add y axis
        const yAxis = this.svg.append("g")
                        .attr("transform", `translate(${this.width + (index * 50) + 20},0)`)
        yAxis.call(d3.axisLeft(y).tickSize(0))
            .style('stroke', color[index])
            .append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", "0.4em")
                .attr("text-anchor", "end")
                .text(name)
                .attr("stroke", color[index])
                .attr("fill", color[index])
        yAxis.select(".domain")
            .style('stroke', color[index])

        const node = this.svg.append("g")

        // add path elm
        if (this.lineType == 'dash') {
            const path = node.append("path")
                .datum(line)
                .attr("fill", "none")
                .attr("stroke", color[index])
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 2)
                .attr("d", lineF)
                .attr("stroke-dasharray", "10 10")
        }else if(this.lineType == 'solid'){
            const path = node.append("path")
                .datum(line)
                .attr("fill", "none")
                .attr("stroke", color[index])
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 2)
                .attr("d", lineF)
        }else if(this.lineType == 'dot'){
            const path = ''
        }

        node.selectAll("circle")
            .data(line)
            .enter()
                .append("circle")
                .attr("class", "dot")
                .attr("r", 4)
                .attr("fill", color[index])
                .attr("cx", d => d.x)
                .attr("cy", d => y(d.y))
                .style("cursor", "pointer")
    }

    addMark(mark, height){
        const node = this.svg.append("g")
                    .selectAll("g")
                    .data(mark)
                    .join("g")

        if (['dash','dot'].includes(this.lineType)) {
            node.append("line")
                .attr("x1", d => d.x)
                .attr("y1", 0)
                .attr("x2", d => d.x)
                .attr("y2", height)
                .attr("stroke", d => d.value)
                .attr("stroke-width", 1.5)
        }else if(this.lineType == 'solid'){
            node.append("line")
                .attr("x1", d => d.x)
                .attr("y1", 0)
                .attr("x2", d => d.x)
                .attr("y2", height)
                .attr("stroke", d => d.value)
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "10 10")
        }

        node.append("text")
            .attr("class", "mark")
            .attr("x", d => d.x)
            .attr("y", 0)
            // .attr("stroke", d => d.value)
            .text(d => d.name)
            .style("fill", d => d.value)
            .style("cursor", "pointer")
    }
}

class LineStory extends svgElement
{
    constructor(svg, data, topTriangles, bottomTriangles){
        super(svg)
        this.data = data
        this.topTriangles = {}
        this.bottomTriangles = {}
        this.story = this.svg.append("rect")
                        .attr("x", 0)
                        .attr("height", data.height)
                        .attr("width", (((data.end_x - data.start_x <= 1) & (data.end_x - data.start_x >= 0)) | (data.count == 1)) ? 1 : data.end_x - data.start_x)
                        .attr("fill", "#808080")

        Object.keys(topTriangles).forEach((key) => {
            this.topTriangles[key] = this.svg.append("g")
                                .selectAll("path")
                                .data(topTriangles[key])
                                .enter()
                                    .append("path")
                                    .attr("class", "topTriangles")
                                    .attr("transform", d => `translate(${d.x},0) rotate(60)`)
                                    .attr("d", d3.symbol().type(d3.symbolTriangle).size(20))
                                    .style("fill", d => d.value)
                                    .style("cursor", "pointer")
        })

        Object.keys(bottomTriangles).forEach((key) => {
            this.bottomTriangles[key] = this.svg.append("g")
                            .selectAll("path")
                            .data(bottomTriangles[key])
                            .enter()
                                .append("path")
                                .attr("class", "bottomTriangles")
                                .attr("transform", d => `translate(${d.x},${data.height})`)
                                .attr("d", d3.symbol().type(d3.symbolTriangle).size(20))
                                .style("fill", "#FFD700")
                                .style("cursor", "pointer")
        })
    }
}

class ScatterPlot extends svgElement
{
    constructor(svg, data){
        super(svg)
        this.data = data

        this.svg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", data.height)
            .attr("stroke", "white")
            .attr("stroke-width", "1");
  
        this.svg.append("line")
            .attr("x1", 0)
            .attr("y1", data.height)
            .attr("x2", data.width)
            .attr("y2", data.height)
            .attr("stroke", "white")
            .attr("stroke-width", "1");

        this.circles = this.svg.selectAll("circle")
                        .data(data.elements)
                        .enter()
                        .append("circle")
                        .attr("pointer-events", "all") 
                        .attr("class", "dot")
                        .attr("cx", d => d.x)
                        .attr("cy", d => d.y)
                        .attr("r", d => d.r)
                        .attr("fill", 'yellow')
                        .attr("stroke", 'gray')
                        .attr("stroke-width", 0.5)
                        .style("cursor", "pointer")
                        // .attr("fill", function(d) { return colorScale(d.color); })
    }
}

class Brush extends svgElement
{
    constructor(svg, width, height, scriptComponentSvg){
        super(svg)
        this.scriptComponentSvg = scriptComponentSvg
        this.globalSvg = svg
        this.width = width + 500
        this.height = height + 500

        this.brush = d3.brush()
                        .extent([[0, 0], [0, 0]])  // 设置刷子的边界
                        .on("end", brushed)

        let that = this
        var ctrlPressed = false;
        d3.select("body")
            .on("keydown", function(event) {
                if ((event.keyCode === 17) && (!ctrlPressed)) {
                    ctrlPressed = true;
                    that.brush.extent([[-500, -500], [that.width, that.height]])
                    that.globalSvg
                        .attr("pointer-events", "none")
                        .call(that.brush)
                }else if((event.keyCode === 17) && (ctrlPressed)){
                    ctrlPressed = false;
                    d3.selectAll(".brush").remove()
                    that.brush.extent([[0, 0], [0, 0]])
                    that.globalSvg
                        .attr("pointer-events", "all")
                        .call(that.brush)
                }
                
            })

        function brushed({selection}) {
            let value = [];
            if (selection) {
                const [[x0, y0], [x1, y1]] = selection
                Object.keys(that.scriptComponentSvg.scatterPlots).forEach(id => {
                    var selector = "#" + id.replace(/\./g, "\\.").replace(/ /g, "\\ ")
                    var transformAttr = that.globalSvg.select(selector).attr("transform");
                    var transformValues = transformAttr.replace(/translate\(|\)/g, '').split(',');
                    var translateX = +transformValues[0]
                    var translateY = +transformValues[1]
                    var v = that.scriptComponentSvg.scatterPlots[id].circles
                                .style("fill", "yellow")
                                .filter(d => {
                                    return x0 <= (translateX + d.x) && (translateX + d.x) < x1 && y0 <= (translateY + d.y) && (translateY + d.y) < y1
                                })
                                .style("fill", "red")
                                .data()
                    value = common.arrayExtend(value, v)
                    that.scriptComponentSvg.displayBottomTip(value)
                })
            } else {
                Object.keys(that.scriptComponentSvg.scatterPlots).forEach(id => {
                    that.scriptComponentSvg.scatterPlots[id].circles.style("fill", "yellow")
                })
            }
            // that.svg.property("value", value).dispatch("input");
          }
    }
}

class Bookmark extends svgElement
{
    constructor(svg, height){
        super(svg)

        function dragged(event) {
            d3.select(this).attr("transform", `translate(${event.x} 0)`)
        }
        this.drag = d3.drag().on("drag", dragged)

        const line = this.svg.append("line").attr("transform", `translate(0 0)`)
                        .attr("y1", 0)
                        .attr("y2", height)
                        .attr("stroke", "green")
                        .attr("stroke-width", 4)
                        .style("cursor", "pointer")
                        .call(this.drag)
    }
}

class TextFileOriginalComponentSvg extends svg
{
    constructor(textFileOriginalView, container){
        super(container)
        this.textFileOriginalView = textFileOriginalView
        this.mode = 'single'
        this.alignType = 'timestamp'
        this.lineType = 'dash'
        this.startPosition = 0
        this.endPosition = 0
        this.viewWidth = 5000
        this.currentHeight = 0
        this.lineChartHeight = 200
        this.lineStoryHeight = 20
        this.intervalHeight = 10

        this.starts = []
        this.ends = []
        this.x = ''
        this.xAxis = ''

        this.tooltip = d3.select(this.container).append("div")
                            .style("display", 'none')
                            .style("position", "absolute")
                            .style("background-color", "#fff")
                            .style("border", "1px solid #aaa")
                            .style("border-radius", "5px")
                            .style("box-shadow", "2px 2px 2px #ccc")
                            .style("font-size", "12px")
                            .style("padding", "5px")

        this.bottomTip = d3.select(this.container).append("div")

        this.textFileOriginalComponentSvgNavigate = new TextFileOriginalComponentSvgNavigate(this)
        this.container.insertBefore(this.textFileOriginalComponentSvgNavigate.container, this.svgElm);
    
        this.resetCoordinates()
    }

    clear(){
        this.svg.selectAll("*").remove()
        if (this.xAxis != '') {
            this.xAxis.selectAll("*").remove()
        }
        this.resetCoordinates()
    }

    resetCoordinates(){
        var zoom = d3.zoom().scaleExtent([this.scaleMin, this.scaleMax]).on("zoom", zoomed)
        d3.select(this.svgElm).call(zoom).on("dblclick.zoom", null)
        d3.select(this.svgElm).on("click", hiddenBottomTip)

        let that = this
        function zoomed(event) {
            const {transform} = event
            d3.select(that.svgElm).select("#canvas").attr("transform", transform)
            that.xAxis.attr("transform", `translate(${transform.x},10)`)

            that.x = d3.scaleLinear().range([0, that.viewWidth * transform.k])
            that.x.domain(d3.extent(that.starts.concat(that.ends)))
            that.xAxis.call(that.updateXAxis, that.x, transform, that.alignType)
        }

        function hiddenBottomTip(){
            that.bottomTip.style("display", 'none')
        }
    }

    getBoundary(){
        // get boundary
        this.starts = []
        this.ends = []
        d3.hierarchy(this.data).eachBefore(d => {
            if (d.data.data != null) {
                if (this.alignType == 'timestamp') {
                    if ((d.data.data.start_timestamp != 0) & (d.data.data.end_timestamp != 0)) {
                        this.starts.push(d.data.data.start_timestamp)
                        this.ends.push(d.data.data.end_timestamp)
                    }
                }else{
                    this.starts.push(d.data.data.start_global_index)
                    this.ends.push(d.data.data.end_global_index)
                }
            }
        })
    }

    addXAxis(){
        // add x axis
        this.x = d3.scaleLinear().range([0, this.viewWidth])
        this.x.domain(d3.extent(this.starts.concat(this.ends)))
        this.xAxis = d3.select(this.svgElm).append("g").attr("transform", "translate(0,10)")
        this.xAxis.call(this.updateXAxis, this.x, {'k': 1}, this.alignType)
    }

    updateXAxis(g, x, transform, alignType){
        var xA = d3.axisBottom(x).ticks(8 * transform.k)
        // var domain = x.domain()
        // var tickValues = xA.scale().ticks().concat(domain[0], domain[1])
        // xA.tickValues(tickValues)
        // g.attr("transform", `translate(0,0)`)
        g.call(xA.tickFormat(function(d) {
                        if (alignType == 'timestamp') {
                            return common.formatTimestamp(d) 
                        }else{
                            return d
                        }
                    }))
                .style('stroke', "#FFF")
                .select(".domain")
                .style('stroke', "#FFF")
        g.selectAll('.tick line').style('stroke', "#FFF")
    }

    addBookmarkLine(){
        // Bookmark line
        function dragged(event) {
            d3.select(this).attr("transform", `translate(${event.x} 0)`)
        }
        this.drag = d3.drag().on("drag", dragged)

        const line = this.svg.append("line").attr("transform", `translate(0 0)`)
                        .attr("y1", 0)
                        .attr("y2", this.currentHeight)
                        .attr("stroke", "#FF3300FF")
                        .attr("stroke-width", 4)
                        .style("cursor", "pointer")
                        .call(this.drag)
    }

    addLineChart(d){
        function getDotTooltipContent(d) {
            var res = `
                <b style="color:#000">Key&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${d.full_name}</b><br/>
                <b style="color:#000">Timestamp: ${common.formatTimestamp(d.timestamp)}</b><br/>
                <b style="color:#000">Value&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${d.value}</b><br/>
            `
            return res
        }

        function getMarkTooltipContent(d) {
            var res = `
                <b style="color:#000">identifier&nbsp;&nbsp;&nbsp;: ${d.identifier}</b><br/>
                <b style="color:#000">Timestamp: ${common.formatTimestamp(d.timestamp)}</b><br/>
                <b style="color:#000">text&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${d.text}</b><br/>
            `
            return res
        }

        let that = this
        var lc = new LineChart(this.svg.select(`#${d.id}`), d.data.data.select_lines, this.lineType, d.ex - d.sx, d.height)
        lc.svg.selectAll('.dot').on("click", function(event, d) {
            if (that.mode == 'single') {
                that.textFileOriginalView.controlJump(d)
            }else{
                var searchAtom = that.textFileOriginalView.getSearchAtomIns(d)
                searchAtom.controlGetAllLines(that, d.search_index)
            }
        })
        this.bindMouseEvent(lc.svg.selectAll('.dot'), getDotTooltipContent)

        lc.svg.selectAll('.mark').on("click", function(event, d) {
            if (that.mode == 'single') {
                that.textFileOriginalView.controlJump(d)
            }else{
                var searchAtom = that.textFileOriginalView.getSearchAtomIns(d)
                searchAtom.controlGetAllLines(that, d.search_index)
            }
        })
        this.bindMouseEvent(lc.svg.selectAll('.mark'), getMarkTooltipContent)
    }

    addLineStory(d){
        function getTooltipContent(d) {
            var res = `
                <b style="color:#000">identifier&nbsp;&nbsp;&nbsp;: ${d.identifier}</b><br/>
                <b style="color:#000">Timestamp: ${common.formatTimestamp(d.timestamp)}</b><br/>
                <b style="color:#000">text&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${d.text}</b><br/>
            `
            return res
        }

        function getStoryTooltipContent(d) {
            var res = `
                <b style="color:#000">identifier: ${d.data.data.identifier}</b><br/>
                <b style="color:#000">desc&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${d.data.data.desc}</b><br/>
            `
            return res
        }

        let that = this
        var ls = new LineStory(this.svg.select(`#${common.replaceSpecialSymbols(d.id, '_')}`), d)
        this.bindMouseEvent(ls.story, getStoryTooltipContent)

        if (ls.specials != '') {
            ls.specials.on("click", function(event, d) {
                if (that.mode == 'single') {
                    that.textFileOriginalView.controlJump(d)
                }else{
                    var searchAtom = that.textFileOriginalView.getSearchAtomIns(d)
                    searchAtom.controlGetAllLines(that, d.search_index)
                }
            })
            this.bindMouseEvent(ls.specials, getTooltipContent)
        }

        Object.keys(ls.marks).forEach((key) => {
            ls.marks[key].on("click", function(event, d) {
                if (that.mode == 'single') {
                    that.textFileOriginalView.controlJump(d)
                }else{
                    var searchAtom = that.textFileOriginalView.getSearchAtomIns(d)
                    searchAtom.controlGetAllLines(that, d.search_index)
                }
            })
            this.bindMouseEvent(ls.marks[key], getTooltipContent)
        })
    }

    addIndentedTree(root){
        new IndentedTree(this.svg, root)
    }

    bindMouseEvent(elm, func){
        let that = this
        elm.on("mouseover", function(event, d) {
            if(['path', 'text'].includes(d3.select(this).node().nodeName)){
                d3.select(this).style('fill', "#FFF")
            }else{
                const currentColor = d3.color(d3.select(this).attr('fill'));
                currentColor.opacity = 0.6;
                d3.select(this).attr('fill', currentColor);
            }

            that.tooltip.html(func(d))
                .style("left", (event.pageX) + "px")
                .style("top", (event.offsetY) + "px")
                .style("display", 'block')
            })
        .on("mouseout", function(event, d) {
            if(['path', 'text'].includes(d3.select(this).node().nodeName)){
                if (d.name) {
                    d3.select(this).style('fill', d => d.value)
                }else{
                    d3.select(this).style('fill', '#FFD700')
                }

            }else{
                const currentColor = d3.color(d3.select(this).attr('fill'));
                currentColor.opacity = 1;
                d3.select(this).attr('fill', currentColor);
            }

            that.tooltip.style("display", 'none')
        })
    }

    displayBottomTip(lines, scrollRow){
        var c = this.createElementDiv()
        var table = this.createElementTable()
        table.id = 'bottomTip'
        lines.forEach((line) => {
            var tr = this.createElementTr()
            tr.insertAdjacentHTML('beforeend', line['text'])
            table.appendChild(tr)
        })
        c.appendChild(table)

        this.bottomTip.html(c.innerHTML)
        .style("display", 'block')

        // var bt = d3.select("#bottomTip")
        var row = this.bottomTip.select(`tr:nth-child(${scrollRow + 1})`).node()
        row.scrollIntoView()
    }

    mapXY(x){
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
                if (this.alignType == 'timestamp') {
                    if ((d.data.data.start_timestamp != 0) & (d.data.data.end_timestamp != 0)){
                        d.sx = x(d.data.data.start_timestamp)
                        d.ex = x(d.data.data.end_timestamp)
                    }else{
                        d.sx = 0
                        d.ex = 0
                    }
                }else{
                    d.sx = x(d.data.data.start_global_index)
                    d.ex = x(d.data.data.end_global_index)
                }

                var chartX = d3.scaleLinear().range([0, d.ex - d.sx])
                chartX.domain([d.sx, d.ex])
                if (d.data.data.type == 'chart') {
                    // convert timestamp or global_index to x
                    Object.keys(d.data.data.select_lines).forEach((name) =>{
                        d.data.data.select_lines[name].forEach(dot => {
                            if (this.alignType == 'timestamp') {
                                dot.x = chartX(x(dot.timestamp))
                            }else{
                                dot.x = chartX(x(dot.global_index))
                            }
                        })
                    })
                    d.height = this.lineChartHeight
                    this.currentHeight = this.currentHeight + this.lineChartHeight + this.intervalHeight
                }else if(d.data.data.type == 'search'){
                    Object.keys(d.data.data.res_marks).forEach((key) =>{
                        d.data.data.res_marks[key].forEach(dot => {
                            if (this.alignType == 'timestamp') {
                                dot.x = chartX(x(dot.timestamp))
                            }else{
                                dot.x = chartX(x(dot.global_index))
                            }
                        })
                    })

                    if (d.data.data.res_compare_special_lines.length > 0) {
                        d.data.data.res_compare_special_lines.forEach((dot) =>{
                            if (this.alignType == 'timestamp') {
                                dot.x = chartX(x(dot.timestamp))
                            }else{
                                dot.x = chartX(x(dot.global_index))
                            }
                        })
                    }
                    d.height = this.lineStoryHeight
                    this.currentHeight = this.currentHeight + this.lineStoryHeight + this.intervalHeight
                }
            }
        })
        return root
    }

    update(data){
        this.clear()
        this.currentHeight = 0
        if (data) {
            this.data = data
        }
        this.textFileOriginalComponentSvgNavigate.setTitle(this.textFileOriginalView.model.file_name)
        this.svg.style("overflow", "visible")

        this.getBoundary()
        this.addXAxis()
        var root = this.mapXY(this.x)

        this.addIndentedTree(root)

        const nodes = root.descendants()
        nodes.forEach(d => {
            if (d.data.data != null){   
                if (d.data.data.type == 'chart') {
                    this.addLineChart(d)  
                }else if(d.data.data.type == 'search'){
                    this.addLineStory(d)
                }
            }
        })
        this.addBookmarkLine()
        this.bottomTip.style("width", `${document.body.offsetWidth}px`)
            .style("height", '150px')
            .style("display", 'none')
            .style("position", "absolute")
            .style("bottom", "0")
            .style("left", "0")
            .style("background-color", "#000")
            .style("color", "white")
            .style("padding", "5px")
            .style("font-size", "12px")
            .style("border", "1px solid #aaa")
            .style("border-radius", "5px")
            .style("box-shadow", "2px 2px 2px #ccc")
            .style("opacity", 0.8)
            .style("overflow", "auto")
        // console.log(this.svg.node())
    }
}

class ChartAtomComponentSvgDialog extends Dialog
{
    constructor(chartAtomView){
        super(chartAtomView.container)
        this.chartAtomView = chartAtomView
        this.subContainer.style.width = '90%' 
        this.subContainer.style.height = `${document.body.offsetHeight - 200}px`

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
        this.rolePath = this.createElementTextInput()
        this.subContainer.appendChild(this.createElementHeader('Describe module/role hierarchy (Optional)'))
        this.subContainer.appendChild(this.rolePath)
        this.subContainer.appendChild(this.createElementHr())

        this.subContainer.appendChild(this.createElementHeader('Key Value Tree'))
        this.chartAtomComponentSvg = new ScriptComponentSvg(this.subContainer, this.chartAtomView.parent.parent.parent.parent)
        this.chartAtomComponentSvg.container.style.height = `${parseInt(document.body.offsetHeight / 2)}px`

        let that = this
        this.cancelBtn = this.createElementButton('CANCEL')
        this.cancelBtn.style.backgroundColor = 'red'
        this.cancelBtn.onclick = function(){that.hidden()}
        this.cancelBtn.style.width = '20%'
        this.clearBtn = this.createElementButton('CLEAR')
        this.clearBtn.style.backgroundColor = 'blue'
        this.clearBtn.onclick = function(){that.clear()}
        this.clearBtn.style.width = '20%'
        this.applyBtn = this.createElementButton('APPLY')
        this.applyBtn.style.backgroundColor = 'green'
        this.applyBtn.onclick = function(){that.apply()}
        this.applyBtn.style.width = '60%'
        this.subContainer.appendChild(this.applyBtn)
        this.subContainer.appendChild(this.clearBtn)
        this.subContainer.appendChild(this.cancelBtn)
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

    model(){
        return {
            namespace: this.chartAtomView.namespace,
            identifier: this.identifier.value,
            desc: this.desc.value,
            key_value_tree: this.chartAtomComponentSvg.data,
            role_path: this.rolePath.value,
            is_active: this.chartAtomView.show.container.style.display === "none" ? false : true
        }
    }

    apply(){
        this.chartAtomView.controlExec(this.model())
    }

    update(model){
        this.identifier.value = model.identifier
        this.desc.value = model.desc
        this.rolePath.value = model.role_path
        this.chartAtomView.collapsible.innerHTML = '+ ' + model.desc
        this.chartAtomComponentSvg.refresh(model.key_value_tree)
        let that = this
        this.chartAtomComponentSvg.tidyTrees[''].nodeEnter.on("click", (event, d) => {
            that.clickEvent(event, d)
        })
    }

    clear(){
        this.chartAtomView.controlClearKeyValueTree()
    }
}

class ChartAtomComponentLineChart extends svg
{    
    constructor(chartAtomView){
        super(chartAtomView.container)
        this.chartAtomView = chartAtomView

        this.container.style.display = 'none'
		let that = this
		this.chartAtomView.collapsible.addEventListener("click", function() {
			if (that.container.style.display === "block") {
				that.container.style.display = "none"
			} else {
				that.container.style.display = "block"
			}
		})

        this.alignType = 'timestamp'
        this.lineType = 'dash'
        this.startPosition = 0
        this.endPosition = 0
        this.viewWidth = document.body.offsetWidth - 100
        this.container.style.height = `${parseInt(document.body.offsetHeight / 2 - 100)}px`
        this.lineChartHeight = parseInt(document.body.offsetHeight / 2 - 120)


        this.starts = []
        this.ends = []
        this.x = ''
        this.xAxis = ''

        this.tooltip = d3.select(this.container).append("div")
                            .style("display", 'none')
                            .style("position", "absolute")
                            .style("background-color", "#fff")
                            .style("border", "1px solid #aaa")
                            .style("border-radius", "5px")
                            .style("box-shadow", "2px 2px 2px #ccc")
                            .style("font-size", "12px")
                            .style("padding", "5px")

        this.chartAtomComponentLineChartNavigate = new ChartAtomComponentLineChartNavigate(this)
        this.container.insertBefore(this.chartAtomComponentLineChartNavigate.container, this.svgElm);

        this.resetCoordinates()
    }

    clear(){
        this.svg.selectAll("*").remove()
        if (this.xAxis != '') {
            this.xAxis.selectAll("*").remove()
        }
        this.resetCoordinates()
    }

    resetCoordinates(){
        var zoom = d3.zoom().scaleExtent([this.scaleMin, this.scaleMax]).on("zoom", zoomed)
        d3.select(this.svgElm).call(zoom).on("dblclick.zoom", null)

        let that = this
        function zoomed(event) {
            const {transform} = event
            d3.select(that.svgElm).select("#canvas").attr("transform", transform)
            that.xAxis.attr("transform", `translate(${transform.x},10)`)

            that.x = d3.scaleLinear().range([0, that.viewWidth * transform.k])
            if (that.alignType == 'timestamp') {
                that.x.domain([that.data.start_timestamp, that.data.end_timestamp])
            }else{
                that.x.domain([that.data.start_global_index, that.data.end_global_index])
            }
            that.xAxis.call(that.updateXAxis, that.x, transform, that.alignType)
        }
    }

    addXAxis(){
        // add x axis
        this.x = d3.scaleLinear().range([0, this.viewWidth])
        if (this.alignType == 'timestamp') {
            this.x.domain([this.data.start_timestamp, this.data.end_timestamp])
        }else{
            this.x.domain([this.data.start_global_index, this.data.end_global_index])
        }
        this.xAxis = d3.select(this.svgElm).append("g").attr("transform", "translate(0,10)")
        this.xAxis.call(this.updateXAxis, this.x, {'k': 1}, this.alignType)
    }

    updateXAxis(g, x, transform, alignType){
        var xA = d3.axisBottom(x).ticks(8 * transform.k)
        // var domain = x.domain()
        // var tickValues = xA.scale().ticks().concat(domain[0], domain[1])
        // xA.tickValues(tickValues)
        // g.attr("transform", `translate(0,0)`)
        g.call(xA.tickFormat(function(d) {
                        if (alignType == 'timestamp') {
                            return common.formatTimestamp(d) 
                        }else{
                            return d
                        }
                    }))
                .style('stroke', "#FFF")
                .select(".domain")
                .style('stroke', "#FFF")
        g.selectAll('.tick line').style('stroke', "#FFF")
    }

    addLineChart(d){
        function getDotTooltipContent(d) {
            var res = `
                <b style="color:#000">Key&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${d.full_name}</b><br/>
                <b style="color:#000">Timestamp: ${common.formatTimestamp(d.timestamp)}</b><br/>
                <b style="color:#000">Value&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${d.value}</b><br/>
            `
            return res
        }

        function getMarkTooltipContent(d) {
            var res = `
                <b style="color:#000">identifier&nbsp;&nbsp;&nbsp;: ${d.identifier}</b><br/>
                <b style="color:#000">Timestamp: ${common.formatTimestamp(d.timestamp)}</b><br/>
                <b style="color:#000">text&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${d.text}</b><br/>
            `
            return res
        }

        let that = this
        var lc = new LineChart(this.svg, d.select_lines, this.lineType, this.viewWidth, this.lineChartHeight)
        lc.svg.selectAll('.dot').on("click", function(event, d) {
            that.chartAtomView.controlClickEvent(d)
        })
        this.bindMouseEvent(lc.svg.selectAll('.dot'), getDotTooltipContent)

        lc.svg.selectAll('.mark').on("click", function(event, d) {
            that.chartAtomView.controlClickEvent(d)
        })
        this.bindMouseEvent(lc.svg.selectAll('.mark'), getMarkTooltipContent)
    }

    bindMouseEvent(elm, func){
        let that = this
        elm.on("mouseover", function(event, d) {
            if(['path', 'text'].includes(d3.select(this).node().nodeName)){
                d3.select(this).style('fill', "#FFF")
            }else{
                const currentColor = d3.color(d3.select(this).attr('fill'));
                currentColor.opacity = 0.6;
                d3.select(this).attr('fill', currentColor);
            }

            that.tooltip.html(func(d))
                .style("left", (event.pageX) + "px")
                .style("top", (event.offsetY) + "px")
                .style("display", 'block')
            })
        .on("mouseout", function(event, d) {
            if(['path', 'text'].includes(d3.select(this).node().nodeName)){
                if (d.name) {
                    d3.select(this).style('fill', d => d.value)
                }else{
                    d3.select(this).style('fill', '#FFD700')
                }

            }else{
                const currentColor = d3.color(d3.select(this).attr('fill'));
                currentColor.opacity = 1;
                d3.select(this).attr('fill', currentColor);
            }

            that.tooltip.style("display", 'none')
        })
    }

    mapXY(x){
        // map x y
        // convert timestamp or global_index to x
        Object.keys(this.data.select_lines).forEach((name) =>{
            this.data.select_lines[name].forEach(dot => {
                if (this.alignType == 'timestamp') {
                    dot.x = x(dot.timestamp)
                }else{
                    dot.x = x(dot.global_index)
                }
            })
        })
    }

    refresh(data){
        this.chartAtomView.collapsible.innerHTML = '+ ' + this.chartAtomView.model.desc
        this.clear()
        this.currentHeight = 0
        if (data) {
            this.data = data
        }
        this.svg.style("overflow", "visible")

        this.addXAxis()
        this.mapXY(this.x)
        this.addLineChart(this.data)
    }

}

class ScriptDialog extends Dialog
{
    constructor(scriptView, textAnalysisView){
        super(scriptView.container)
        this.scriptView = scriptView

        this.subContainer.style.display = 'flex'
        this.subContainer.style.flexDirection = 'row'
        this.subContainer.style.width = '100%'
        this.subContainer.style.overflow = 'hidden'
        this.container.style.overflow = 'hidden'
        this.desc = ''
        this.script = ''

        this.leftDiv = this.createElementDiv()
        this.leftDiv.style.width = '50%'
        this.leftDiv.style.height = '100%'

        let that = this
        //  python script 
        this.textarea = this.createElementTextarea()
        this.leftDiv.appendChild(this.createElementHeader('Python Script'))
        this.leftDiv.appendChild(this.textarea)
        this.script = this.createPythonCodeMirror(this.textarea)
        this.script.setSize(null, parseInt(document.body.offsetHeight / 2))

        //  console
        this.console = this.createElementTextarea()
        this.console.style.height = '150px'
        this.console.style.backgroundColor = 'black'
        this.console.style.color = 'white'
        this.console.style.fontSize = '12px'
        this.leftDiv.appendChild(this.createElementHeader('Console'))
        this.leftDiv.appendChild(this.console)

        // execute and cancel button
        this.apply = this.createElementButton('EXECUTE')
        this.apply.style.width = '80%'
        this.apply.onclick = function(){
            // that.console.value = ''
            that.run()
        }
        this.cancel = this.createElementButton('CANCEL')
        this.cancel.style.backgroundColor = 'red'
        this.cancel.style.width = '20%'
        this.cancel.onclick = function(){that.hidden()}
        this.leftDiv.appendChild(this.apply)
        this.leftDiv.appendChild(this.cancel)

        this.rightDiv = this.createElementDiv()
        this.rightDiv.style.width = '50%'
        this.rightDiv.style.height = '100%'
        this.plotArea = new ScriptComponentSvg(this.rightDiv, textAnalysisView)
        this.subContainer.append(this.leftDiv)
        this.subContainer.append(this.rightDiv)
        this.plotArea.container.style.height = `${parseInt(document.body.offsetHeight / 2 + 230)}px`
    }

    model(){
        return {script: [this.script.getValue()]}
    }

    log(msg){
        this.console.value = this.console.value != '' ? this.console.value + '\n' + msg : msg
        this.console.scrollTop = this.console.scrollHeight
    }

    update(model){
        // this.desc.value = model.desc
        this.script.setValue(model.script[0])
        this.script.setSize(null, parseInt(document.body.offsetHeight / 2))
        let that = this
        setTimeout(function() {
            that.script.refresh()
        }, 100)
        this.script.scrollIntoView({ line: 0, ch: 0 }, 0)
    }

    draw(data){
        this.plotArea.refresh(data)
    }

    run(){
        this.console.value = ''
        this.scriptView.controlExec(this.model())
    }
}

class ScriptComponentSvg extends svg
{
    constructor(container, textAnalysisView){
        super(container)
        this.textAnalysisView = textAnalysisView
        this.xAxis = ''
        this.tidyTrees = {}
        this.indentedTrees = {}
        this.lineCharts = {}
        this.lineStorys = {}
        this.scatterPlots = {}

        this.tooltip = d3.select(this.container).append("div")
                            .style("display", 'none')
                            .style("position", "absolute")
                            .style("background-color", "#fff")
                            .style("border", "1px solid #aaa")
                            .style("border-radius", "5px")
                            .style("box-shadow", "2px 2px 2px #ccc")
                            .style("font-size", "12px")
                            .style("padding", "5px")

        this.bottomTip = d3.select(this.container).append("div")
                            .style("width", `${document.body.offsetWidth / 2}px`)
                            .style("height", '150px')
                            .style("display", 'none')
                            .style("position", "absolute")
                            .style("bottom", "0")
                            .style("left", "0")
                            .style("background-color", "#000")
                            .style("color", "white")
                            .style("padding", "5px")
                            .style("font-size", "12px")
                            .style("border", "1px solid #aaa")
                            .style("border-radius", "5px")
                            .style("box-shadow", "2px 2px 2px #ccc")
                            .style("opacity", 0.8)
                            .style("overflow", "auto")
    }

    clear(){  
        this.svg.selectAll("*").remove()
        if (this.xAxis != '') {
            this.xAxis.svg.selectAll("*").remove()
        }
        this.resetCoordinates()
        this.xAxis = ''
        this.tidyTrees = {}
        this.indentedTrees = {}
        this.lineCharts = {}
        this.lineStorys = {}
        this.scatterPlots = {}
    }

    resetCoordinates(){
        var zoom = d3.zoom().scaleExtent([this.scaleMin, this.scaleMax]).on("zoom", zoomed).filter(function(event) {
            return event.button === 2 || event instanceof WheelEvent;
        });
        d3.select(this.svgElm).call(zoom).on("dblclick.zoom", null)
        d3.select(this.svgElm).on("click", hiddenBottomTip)

        let that = this
        function zoomed(event) {
            const {transform} = event
            d3.select(that.svgElm).select("#canvas").attr("transform", transform)
            if (that.xAxis != '') {
                that.xAxis.svg.attr("transform", `translate(${transform.x},10)`)
                that.xAxis.x = d3.scaleLinear().range([0, that.xAxis.pixelWidth * transform.k])
                that.xAxis.x.domain([that.xAxis.lowerBound, that.xAxis.upperBound])
                that.xAxis.svg.call(that.xAxis.updateXAxis, that.xAxis.x, transform, that.xAxis.tickFormatFunc)
            }
        }

        function hiddenBottomTip(){
            that.bottomTip.style("display", 'none')
        }
    }

    bindMouseOverOutEvent(elm, func){
        let that = this
        elm.on("mouseover", function(event, d) {
            if(['path', 'text'].includes(d3.select(this).node().nodeName)){
                d3.select(this).style('fill', "#FFF")
            }else{
                const currentColor = d3.color(d3.select(this).attr('fill'));
                currentColor.opacity = 0.6;
                d3.select(this).attr('fill', currentColor);
            }
            that.tooltip.html(func(d))
                .style("left", (event.offsetX) + "px")
                .style("top", (event.offsetY) + "px")
                .style("display", 'block')
            })
        .on("mouseout", function(event, d) {
            if(['path', 'text'].includes(d3.select(this).node().nodeName)){
                if (d.name) {
                    d3.select(this).style('fill', d => d.value)
                }else{
                    d3.select(this).style('fill', '#FFD700')
                }
            }else{
                const currentColor = d3.color(d3.select(this).attr('fill'));
                currentColor.opacity = 1;
                d3.select(this).attr('fill', currentColor);
            }
            that.tooltip.style("display", 'none')
        })
    }

    displayBottomTip(items, scrollRow=0){
        var c = this.createElementDiv()
        var table = this.createElementTable()
        table.id = 'bottomTip'
        items.forEach((item, index) => {
            var tr = this.createElementTr()
            var td = this.createElementTd()
            td.innerHTML = `${index} `
            tr.appendChild(td)
            if ((index===0)&&(item.filter)) {
                var thead = this.createElementTr()
                var th = this.createElementTh()
                th.innerHTML = 'Index'
                thead.appendChild(th)
                Object.keys(item).forEach(key => {
                    if (!item.filter.includes(key)){
                        var th = this.createElementTh()
                        th.innerHTML = `${key}`
                        thead.appendChild(th)
                    }
                })
                table.appendChild(thead)
            }

            Object.keys(item).forEach(key => {
                if(item.filter){
                    if (!item.filter.includes(key)){
                        td = this.createElementTd()
                        td.innerHTML = `${item[key]} `
                        tr.appendChild(td)
                    }
                }else{
                    tr.insertAdjacentHTML('beforeend', item[key])
                }
            })
            table.appendChild(tr)
        })
        c.appendChild(table)
        this.bottomTip.html(c.innerHTML)
        .style("display", 'block')

        if (scrollRow != 0){
            var row = this.bottomTip.select(`tr:nth-child(${scrollRow + 1})`).node()
            row.scrollIntoView()
        }
    }

    refresh(data){
        function getTooltipContent(d) {
            var res = ''
            Object.keys(d).forEach(key => {
                if (!d.filter.includes(key)){
                    res = res + `<b style="color:#000">${key}: ${d[key]}</b><br/>`
                }
            })
            return res
        }

        let that = this
        this.clear()
        this.data = data
        this.data.forEach(graph => {
            var selector = ''
            if(graph.type == 'XAxis'){
                this.xAxis = new XAxis(d3.select(this.svgElm), graph.width, graph.lower_bound, graph.upper_bound, graph.tick_format_func)
            }else if(graph.type == 'TidyTree'){
                if (graph.id == ''){
                    this.tidyTrees[graph.id] = new TidyTree(this.svg, graph.elements)
                }else{
                    selector = "#" + graph.id.replace(/\./g, "\\.").replace(/ /g, "\\ ");
                    this.tidyTrees[graph.id] = new TidyTree(this.svg.select(selector), graph.elements)
                }
            }else if(graph.type == 'IndentedTree'){
                if (graph.id == ''){
                    this.indentedTrees[graph.id] = new IndentedTree(this.svg, graph.elements)
                }else{
                    selector = "#" + graph.id.replace(/\./g, "\\.").replace(/ /g, "\\ ");
                    this.indentedTrees[graph.id] = new IndentedTree(this.svg.select(selector), graph.elements)
                }
            }else if(graph.type == 'ScatterPlot'){
                selector = "#" + graph.id.replace(/\./g, "\\.").replace(/ /g, "\\ ");
                this.scatterPlots[graph.id] = new ScatterPlot(this.svg.select(selector), graph)
                this.bindMouseOverOutEvent(this.scatterPlots[graph.id].svg.selectAll('.dot'), getTooltipContent)
                this.scatterPlots[graph.id].svg.selectAll('.dot').on("click", function(event, d) {
                    eval(d.api)
                })
            }else if(graph.type == 'LineChart'){
                if (graph.id == ''){
                    this.lineCharts[graph.id] = new LineChart(this.svg, graph.elements, 'dash', graph.width, graph.height)
                }else{
                    selector = "#" + graph.id.replace(/\./g, "\\.").replace(/ /g, "\\ ");
                    this.lineCharts[graph.id] = new LineChart(this.svg.select(selector), graph.elements, 'dash', graph.width, graph.height)
                }
                this.bindMouseOverOutEvent(this.lineCharts[graph.id].svg.selectAll('.dot'), getTooltipContent)
                this.lineCharts[graph.id].svg.selectAll('.dot').on("click", function(event, d) {
                    eval(d.api)
                })
                this.bindMouseOverOutEvent(this.lineCharts[graph.id].svg.selectAll('.mark'), getTooltipContent)
                this.lineCharts[graph.id].svg.selectAll('.mark').on("click", function(event, d) {
                    eval(d.api)
                })
            }else if(graph.type == 'LineStory'){
                selector = "#" + graph.id.replace(/\./g, "\\.").replace(/ /g, "\\ ");
                this.lineStorys[graph.id] = new LineStory(this.svg.select(selector), graph, graph.elements.top_triangles, graph.elements.bottom_triangles)
            
                // this.bindMouseOverOutEvent(this.lineStorys[graph.data.id].story, getTooltipContent)
                this.bindMouseOverOutEvent(this.lineStorys[graph.id].svg.selectAll('.topTriangles'), getTooltipContent)
                this.bindMouseOverOutEvent(this.lineStorys[graph.id].svg.selectAll('.bottomTriangles'), getTooltipContent)
                this.lineStorys[graph.id].svg.selectAll('.topTriangles').on("click", function(event, d) {
                    eval(d.api)
                })
                this.lineStorys[graph.id].svg.selectAll('.bottomTriangles').on("click", function(event, d) {
                    eval(d.api)
                })
            }else if(graph.type == 'Brush'){
                this.brush = new Brush(this.svg, graph.width, graph.height, this)
            }else if(graph.type == 'Bookmark'){
                this.bookmark = new Bookmark(this.svg, graph.height)
            }
        })
    }
}

class TextFileCompareComponentSvgDialog extends Dialog
{
    constructor(textFileCompareView){
        super(textFileCompareView.container)
        this.textFileCompareView = textFileCompareView

        this.subContainer.style.display = 'flex'
        this.subContainer.style.flexDirection = 'column'
        this.subContainer.style.border = '1px solid #808080'
        this.subContainer.style.width = '100%' 
        this.subContainer.style.height = '100%'
        // this.subContainer.style.pointerEvents = 'none'
        // this.subContainer.style.margin = '1% auto 1% auto'
        this.subContainer.style.margin = 0
        this.subContainer.style.overflow = 'hidden'

        this.textFileCompareComponentSvgDialogNavigate = new TextFileCompareComponentSvgDialogNavigate(this)
        this.subContainer.append(this.textFileCompareComponentSvgDialogNavigate.container)
    
        this.firstDiv = this.createElementDiv()
        this.firstDiv.style.width = '100%'
        this.firstDiv.style.height = '50%'

        this.secondDiv = this.createElementDiv()
        this.secondDiv.style.width = '100%'
        this.secondDiv.style.height = '50%'
        this.subContainer.append(this.firstDiv)
        this.subContainer.append(this.secondDiv)

        this.firstSvg = new ScriptComponentSvg(this.firstDiv, this.textFileCompareView.parent)
        this.firstSvg.mode = 'compare'
        this.firstSvg.container.style.flex = 1
        this.firstSvg.container.style.border = '2px solid orange'
        this.firstSvg.container.style.borderBottomWidth = '5px'
        this.secondSvg = new ScriptComponentSvg(this.secondDiv, this.textFileCompareView.parent)
        this.secondSvg.mode = 'compare'
        this.secondSvg.container.style.flex = 1
        this.secondSvg.container.style.border = '2px solid orange'
        this.secondSvg.container.style.borderTopWidth = '5px'
    }

    clear(){
        this.firstSvg.clear()
        this.secondSvg.clear()
    }

    refresh(first, second){
        this.firstSvg.textFileOriginalView = first
        this.firstSvg.namespace = first.namespace.split('/').slice(0,4).join('/')
        this.firstSvg.bottomTip.style("width", `${document.body.offsetWidth}px`)
        this.firstSvg.refresh(first.model.graphs)

        this.secondSvg.textFileOriginalView = second
        this.secondSvg.namespace = second.namespace.split('/').slice(0,4).join('/')
        this.secondSvg.bottomTip.style("width", `${document.body.offsetWidth}px`)
        this.secondSvg.refresh(second.model.graphs)

        this.textFileCompareComponentSvgDialogNavigate.title.innerHTML = `${this.firstSvg.textFileOriginalView.model.file_name}   VS   ${this.secondSvg.textFileOriginalView.model.file_name}`
    }
}

export {ScriptDialog, ScriptComponentSvg, TextFileOriginalComponentSvg, TextFileCompareComponentSvgDialog, ChartAtomComponentSvgDialog, ChartAtomComponentLineChart}