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
    constructor(svg){
        super(svg)
        this.nodeEnter = ''
    }

    clear(){
        this.svg.selectAll("*").remove()
        // this.iterationClear([this.data])
        // this.draw(this.data)
    }

    update(data){
        this.clear()
        this.data = data
        this.draw()
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
                return d.data.name
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
                return d.data.name
            })
            .attr("stroke", "white")
            .attr("fill", "white")
            .style("cursor", "pointer")
            .on("click", function(event, d) {
                console.log(d)
            })
            
        text.each(function() {
            var textWidth = this.getComputedTextLength();
            d3.select(this)
                .attr("transform", "translate(" + -1 * textWidth + ", 0)");
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
                .attr("cy", d => y(d.value))
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
                        .attr("width", (((data.ex - data.sx < 1) & (data.ex - data.sx > 0)) | (data.count == 1)) ? 1 : data.ex - data.sx)
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
                                .attr("transform", s => `translate(${s.x},${d.height})`)
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
        var xScale = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return d.x; })])
            .range([height, 0]);

        var yScale = d3.scaleLinear()
            .domain([0, d3.max(data, function(d) { return d.y; })])
            .range([height, 0]);

        this.circles = svg.selectAll("circle")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("cx", function(d) { return xScale(d.x); })
                        .attr("cy", function(d) { return yScale(d.y); })
                        .attr("r", function(d) { return rScale(d.r); })
                        .attr("fill", function(d) { return colorScale(d.color); })
    }
}

class SelectionRect extends svgElement
{
    constructor(svg){
        super(svg)
        var selectionRect = svg.append("rect")
                            .attr("class", "selection")
                            .attr("rx", 6)
                            .attr("ry", 6)
                            .attr("x", 0)
                            .attr("y", 0)
                            .attr("width", 0)
                            .attr("height", 0)
                            .style("stroke", "#D4AF37")
                            .style("fill", "#F8ECC2")
                            .style("opacity", 0.5)
                            .style("display", "none")
        
        svg.on("mousedown", startSelection);
        svg.on("mousemove", moveSelection);
        svg.on("mouseup", endSelection);
        
        function startSelection() {
            selectionRect.attr("x", d3.event.pageX)
                .attr("y", d3.event.pageY)
                .style("display", "inline");
        }
        
        function moveSelection() {
            if (!d3.event.which) return;
            var x = Math.min(d3.event.pageX, selectionRect.attr("x"));
            var y = Math.min(d3.event.pageY, selectionRect.attr("y"));
            var width = Math.abs(d3.event.pageX - selectionRect.attr("x"));
            var height = Math.abs(d3.event.pageY - selectionRect.attr("y"));
            selectionRect.attr("x", x)
                .attr("y", y)
                .attr("width", width)
                .attr("height", height);
            }
            
        function endSelection() {
            selectionRect.style("display", "none");
            var x0 = parseInt(selectionRect.attr("x"));
            var y0 = parseInt(selectionRect.attr("y"));
            var x1 = x0 + parseInt(selectionRect.attr("width"));
            var y1 = y0 + parseInt(selectionRect.attr("height"));
            
            circles.classed("selected", function(d) {
                var cx = xScale(d.x);
                var cy = yScale(d.y);
                return cx >= x0 && cx < x1 && cy >= y0 && cy < y1;
            });
        }
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
        this.subContainer.appendChild(this.createElementHeader('Describe module/role hierarchy. (Optional)'))
        this.subContainer.appendChild(this.rolePath)
        this.subContainer.appendChild(this.createElementHr())

        this.subContainer.appendChild(this.createElementHeader('Key Value Tree'))
        this.chartAtomComponentSvg = new ChartAtomComponentSvg(this)

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
        this.chartAtomComponentSvg.update(model.key_value_tree)
    }

    clear(){
        this.chartAtomView.controlClearKeyValueTree()
    }
}

class ChartAtomComponentSvg extends svg
{
    constructor(dialog){
        super(dialog.subContainer)
        this.tree = new TidyTree(this.svg)
        this.container.style.height = `${document.body.offsetHeight / 2}px`
    }

    update(data){
        let that = this
        this.data = data
        this.tree.update(this.data)
        this.tree.nodeEnter.on("click", (event, d) => {
                that.clickEvent(event, d)
                // update(d);
                // console.log(that.data)
            });
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
        this.plotArea.container.style.height = `${parseInt(document.body.offsetHeight / 2 + 200)}px`
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
        this.plotArea.update(data)
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
    }

    resetCoordinates(){
        var zoom = d3.zoom().scaleExtent([this.scaleMin, this.scaleMax]).on("zoom", zoomed)
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
            console.log('----')
            // that.bottomTip.style("display", 'none')
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

    update(data){
        function getTooltipContent(d) {
            var res = ''
            Object.keys(d).forEach(key => {
                res = res + `<b style="color:#000">${key}: ${d[key]}</b><br/>`
            })
            return res
        }

        let that = this
        this.clear()
        this.data = data
        this.data.forEach(subplot => {
            if(subplot.type == 'XAxis'){
                this.xAxis = new XAxis(d3.select(this.svgElm), subplot.pixel_width, subplot.lower_bound, subplot.upper_bound, subplot.tick_format_func)
            }else if(subplot.type == 'SelectionRect'){
                this.selectionRect = new SelectionRect()
            }else if(subplot.type == 'TidyTree'){
                subplot.data.forEach(tidyTree => {
                    this.tidyTrees[indentedTree.identifier] = new TidyTree(this.svg, tidyTree)
                })
            }else if(subplot.type == 'IndentedTree'){
                subplot.data.forEach(indentedTree => {
                    this.indentedTrees[indentedTree.identifier] = new IndentedTree(this.svg, indentedTree.data)
                })
            }else if(subplot.type == 'ScatterPlot'){
                subplot.data.forEach(scatterPlot => {
                    this.scatterPlots[scatterPlot.identifier] = new ScatterPlot(this.svg, scatterPlot)
                    
                    this.bindMouseOverOutEvent(this.scatterPlots[scatterPlot.identifier].svg.selectAll('.dot'), getTooltipContent)
                    this.scatterPlots[scatterPlot.identifier].svg.selectAll('.dot').on("click", function(event, d) {
                        eval(d.api)
                    })
                })
            }else if(subplot.type == 'LineChart'){
                subplot.data.forEach(lineChart => {
                    this.lineCharts[lineChart.identifier] = new LineChart(this.svg.select(`#${lineChart.identifier}`), lineChart.data.select_lines, lineChart.data.line_type, lineChart.data.width, lineChart.data.height)
                    
                    this.bindMouseOverOutEvent(this.lineCharts[lineChart.identifier].svg.selectAll('.dot'), getTooltipContent)
                    this.lineCharts[lineChart.identifier].svg.selectAll('.dot').on("click", function(event, d) {
                        // eval(`that.textAnalysisView.fileContainerView.controlNewFile(['D:\\projects\\ericsson_flow\\new_files\\ru_lock_unlock_normal1_simple.log'])`)
                        eval(d.api)
                    })
                    this.bindMouseOverOutEvent(this.lineCharts[lineChart.identifier].svg.selectAll('.mark'), getTooltipContent)
                    this.lineCharts[lineChart.identifier].svg.selectAll('.mark').on("click", function(event, d) {
                        eval(d.api)
                    })
                })
            }else if(subplot.type == 'LineStory'){
                subplot.data.forEach(lineStory => {
                    this.lineStorys[lineStory.identifier] = new LineStory(this.svg.select(`#${lineStory.identifier}`), lineStory.data, lineStory.data.top_triangles, lineStory.data.bottom_triangles)
                
                    this.bindMouseOverOutEvent(this.lineStorys[lineStory.identifier].story, getTooltipContent)
                    this.bindMouseOverOutEvent(this.lineStorys[lineStory.identifier].svg.selectAll('.topTriangles'), getTooltipContent)
                    this.bindMouseOverOutEvent(this.lineStorys[lineStory.identifier].svg.selectAll('.bottomTriangles'), getTooltipContent)
                    this.lineStorys[lineStory.identifier].svg.selectAll('.topTriangles').on("click", function(event, d) {
                        eval(d.api)
                    })
                    this.lineStorys[lineStory.identifier].svg.selectAll('.bottomTriangles').on("click", function(event, d) {
                        eval(d.api)
                    })
                })
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

        this.firstSvg = new TextFileOriginalComponentSvg('', this.firstDiv)
        this.firstSvg.mode = 'compare'
        this.firstSvg.container.style.flex = 1
        this.secondSvg = new TextFileOriginalComponentSvg('', this.secondDiv)
        this.secondSvg.mode = 'compare'
        this.secondSvg.container.style.flex = 1
    }

    clear(){
        this.firstSvg.clear()
        this.secondSvg.clear()
    }

    refresh(first, second){
        this.firstSvg.textFileOriginalView = first
        this.firstSvg.update(first.model.data_tree)

        this.secondSvg.textFileOriginalView = second
        this.secondSvg.update(second.model.data_tree)
    }
}

export {ScriptDialog, TextFileOriginalComponentSvg, TextFileCompareComponentSvgDialog, ChartAtomComponentSvgDialog, ChartAtomComponentLineChart}