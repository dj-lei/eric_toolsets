import * as d3 from "d3"
import common from '@/plugins/common'

class svg
{
    constructor(){
        this.canvas = ''
        this.svg = ''
        this.bottomNav = ''
        this.svgInit(0.5, 3)
    }

    svgInit(scaleMin, scaleMax){
        this.canvas = document.createElement('div')
        this.canvas.style.display = "block"
        this.canvas.style.width = "100%"
        this.canvas.style.height = '100%'
        this.canvas.style.backgroundColor = '#555'
        this.canvas.style.border = '1px solid #888'

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('width', '100%')
        svg.setAttribute('height', '100%')
        this.canvas.append(svg)

        this.bottomNav = document.createElement('div')
        this.bottomNav.style.position = 'fixed'
        this.bottomNav.style.bottom = 0
        this.bottomNav.style.width = '100%'
        this.canvas.append(this.bottomNav)

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

    delete(){
        common.removeAll(this.canvas)
    }
}

class TreeSelect extends svg
{
    constructor(data, parent, position){
        super()
        this.register(position)
        this.parent = parent
        this.data = data
        this.draw(this.data, this.svg)
        this.cancelBtn = this.addButton('CANCEL', this.close, 'red')
        this.clearBtn = this.addButton('CLEAR', this.clear, 'blue')
        this.applyBtn = this.addButton('APPLY', this.apply, 'green')
    }

    register(position){
        position.append(this.canvas)
    }

    draw(data, svg){
        // let that = this
        const width = 1600
        const dx = 10
        const dy = width / 6
        const margin = ({top: 10, right: 120, bottom: 10, left: 40})
  
        const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x)
        const root = d3.hierarchy(data);
        const tree = d3.tree().nodeSize([dx, dy])
        
        root.x0 = dy / 2;
        root.y0 = 0;
        
        // root.descendants().forEach((d, i) => {
            // d._children = d.children
            // if (d.depth !== 0) d.children = null
        // })
      
        const gLink = svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5);
      
        const gNode = svg.append("g")
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
      
          const transition = svg.transition()
              .duration(duration)
              .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
              .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));
      
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
                // update(d);
                // console.log(select)
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
        // this.syncTreeAndFilterData(svg, filterData)
    }

    clear(that){
        that.iterationClear([that.data])
        that.svg.selectAll("*").remove()
        that.draw(that.data, that.svg)
    }

    iterationClear(data){
        data.forEach((item) => {
            if ('children' in item){
                this.iterationClear(item['children'])
            }else{
                item.check = false
            }
        })
    }

    apply(that){
        that.parent.keyValueTreeClickEvent()
    }

}

export {TreeSelect}