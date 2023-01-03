import { SequentialChart } from './chart'

class Graph
{
    constructor(position){
        this.container = document.createElement('div')
        this.container.style.display = 'block'
        position.append(this.container)
    }

    hidden(){
        this.container.style.display = 'none'
    }

    display(display){
        if (display) {
            this.container.style.display = display
        }else{
            this.container.style.display = 'block'
        }
    }
}

export {Graph}