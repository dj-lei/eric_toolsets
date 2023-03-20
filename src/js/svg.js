import * as d3 from "d3"
import common from '@/plugins/common'
import { Component } from './element'
import { Dialog } from './dialog'
import { TextFileOriginalComponentSvgNavigate, TextFileCompareComponentSvgDialogNavigate } from './navigate'

const color = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42',
'#d87c7c','#919e8b','#d7ab82','#6e7074','#61a0a8','#efa18d','#787464','#cc7e63','#724e58','#4b565b']

class svg extends Component
{
    constructor(position, scaleMin=0.2, scaleMax=3){
        super(position)
        this.svg = ''

        this.container.style.width = "100%"
        this.container.style.height = '100%'
        this.container.style.backgroundColor = '#000'
        this.container.style.border = '1px solid #888'

        this.svgElm = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        this.svgElm.setAttribute('width', '100%')
        this.svgElm.setAttribute('height', '100%')
        this.container.append(this.svgElm)

        var zoom = d3.zoom().scaleExtent([scaleMin, scaleMax]).on("zoom", zoomed)
        d3.select(this.svgElm).call(zoom).on("dblclick.zoom", null)

        this.svg = d3.select(this.svgElm).append("g")
                    .attr("id", "canvas")
                    .style("font", "12px sans-serif")
                    .append("g")
                        .attr("transform", `translate(${document.body.offsetWidth / 3},${document.body.offsetHeight / 4})`)
    
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
    constructor(svg, d, lineType){
        super(svg)

        this.d = d
        this.lineType = lineType
        this.points = []
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
        const yAxis = this.svg.append("g")
                        .attr("transform", `translate(${(index * -50) - 20},0)`)
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
    constructor(svg, d){
        super(svg)
        this.d = d
        this.marks = {}
        this.specials = ''
        this.story = this.svg.append("rect")
                        .attr("x", 0)
                        .attr("height", d.height)
                        .attr("width", (((d.ex - d.sx < 1) & (d.ex - d.sx > 0)) | (d.data.data.count == 1)) ? 1 : d.ex - d.sx)
                        .attr("fill", "#808080")

        Object.keys(d.data.data.res_marks).forEach((key) => {
            this.marks[key] = this.svg.append("g")
                                .selectAll("path")
                                .data(d.data.data.res_marks[key])
                                .enter()
                                    .append("path")
                                    .attr("transform", d => `translate(${d.x},0) rotate(60)`)
                                    .attr("d", d3.symbol().type(d3.symbolTriangle).size(20))
                                    .style("fill", d => d.value)
                                    .style("cursor", "pointer")
        })

        if (d.data.data.res_compare_special_lines.length > 0) {
            this.specials = this.svg.append("g")
                            .selectAll("path")
                            .data(d.data.data.res_compare_special_lines)
                            .enter()
                                .append("path")
                                .attr("transform", s => `translate(${s.x},${d.height})`)
                                .attr("d", d3.symbol().type(d3.symbolTriangle).size(20))
                                .style("fill", "#FFD700")
                                .style("cursor", "pointer")
        }
    }
}

class TextFileOriginalComponentSvg extends svg
{
    constructor(textFileOriginalView, container){
        super(container)
        this.textFileOriginalView = textFileOriginalView
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

        this.tooltip = d3.select(this.container).append("div")
                            .style("display", 'none')
                            .style("position", "absolute")
                            .style("background-color", "#fff")
                            .style("border", "1px solid #aaa")
                            .style("border-radius", "5px")
                            .style("box-shadow", "2px 2px 2px #ccc")
                            .style("font-size", "12px")
                            .style("padding", "5px")

        // this.container.style.backgroundColor = '#000'
        this.textFileOriginalComponentSvgNavigate = new TextFileOriginalComponentSvgNavigate(this)
        this.container.insertBefore(this.textFileOriginalComponentSvgNavigate.container, this.svgElm);
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
        let that = this
        var x = d3.scaleLinear().range([0, this.viewWidth])
        x.domain(d3.extent(this.starts.concat(this.ends)))
        var xA = d3.axisBottom(x)
        var domain = x.domain()
        var tickValues = xA.scale().ticks().concat(domain[0], domain[1])
        xA.tickValues(tickValues)
        const xAxis = this.svg.append("g")
                        .attr("transform", "translate(0,0)")
        xAxis.call(xA.tickFormat(function(d) {
                if (that.alignType == 'timestamp') {
                    return common.formatTimestamp(d) 
                }else{
                    return d
                }
            }))
        .style('stroke', "#FFF")
        .select(".domain")
        .style('stroke', "#FFF")
        xAxis.selectAll('.tick line').style('stroke', "#FFF")
        return x
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
        var lc = new LineChart(this.svg.select(`#${d.id}`), d, this.lineType)
        lc.svg.selectAll('.dot').on("click", function(event, d) {
            that.textFileOriginalView.controlJump(d)
        })
        this.bindMouseEvent(lc.svg.selectAll('.dot'), getDotTooltipContent)

        lc.svg.selectAll('.mark').on("click", function(event, d) {
            that.textFileOriginalView.controlJump(d)
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
        var ls = new LineStory(this.svg.select(`#${d.id}`), d)

        this.bindMouseEvent(ls.story, getStoryTooltipContent)

        if (ls.specials != '') {
            ls.specials.on("click", function(event, d) {
                that.textFileOriginalView.controlJump(d)
            })
            this.bindMouseEvent(ls.specials, getTooltipContent)
        }

        Object.keys(ls.marks).forEach((key) => {
            ls.marks[key].on("click", function(event, d) {
                that.textFileOriginalView.controlJump(d)
            })
            this.bindMouseEvent(ls.marks[key], getTooltipContent)
        })
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

    addIndentedTree(root){
        new IndentedTree(this.svg, root)
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
        var x = this.addXAxis()
        var root = this.mapXY(x)

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
        // console.log(this.svg.node())
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
        // this.bottomBtnSets.appendChild(this.cancel)
        // this.bottomBtnSets.appendChild(this.clear)
        // this.bottomBtnSets.appendChild(this.apply)
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
        // var cancelBtn = this.createElementButton('CANCEL')
        // cancelBtn.style.backgroundColor = 'red'
        // cancelBtn.style.float = 'right'
        // cancelBtn.onclick = function(){that.batchInsightComponentSvgDialog.hidden()}
        // this.bottomBtnSets.appendChild(cancelBtn)
    }

    clickEvent(event, d){
        if (d.depth == 1) {
            this.batchInsightComponentSvgDialog.batchInsightView.controlGetUniversal(parseInt(d.data.name[d.data.name.length - 1]) )
        }else if(d.depth == 2){
            this.batchInsightComponentSvgDialog.batchInsightView.controlGetSingleInsight(d.data.namespace)
        }
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
        // this.subContainer.style.margin = '2% auto 2% auto'
        this.subContainer.style.margin = '0'

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
        this.firstSvg.container.style.flex = 1
        this.secondSvg = new TextFileOriginalComponentSvg('', this.secondDiv)
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
        // this.bottomBtnSets.appendChild(cancelBtn)
        // this.bottomBtnSets.appendChild(clearBtn)
        // this.bottomBtnSets.appendChild(applyBtn)
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

export {TextFileOriginalComponentSvg, TextFileCompareComponentSvgDialog, BatchInsightComponentSvgDialog, ChartAtomComponentSvgDialog, GlobalChartComponentSvgDialog}