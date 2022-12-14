import http from '@/plugins/http'
import urls from '@/plugins/urls'
import common from '@/plugins/common'
import service from '@/plugins/socket'
import { ipcRenderer } from 'electron'
import { InputDropDown } from './dropDown'
import videojs from "video.js"
import "video.js/dist/video-js.css"

const fs = require('fs')

class Dialog
{
    constructor(){
        this.modal = ''
        this.container = ''
        this.init()
    }

    init(){
        this.modal = document.createElement('div')
        this.modal.className = 'modal'

        this.container = document.createElement('div')
        this.container.style.backgroundColor = '#555'
        this.container.className = 'container'

        this.modal.appendChild(this.container)
    }

    async browseFilesDirectory(_callback){
        let content = await ipcRenderer.invoke('open-dir')
        _callback(content.filePaths[0])
    }

    open(){
        this.modal.style.display = "block"
    }

    close(){
        this.modal.style.display = "none"
    }
}

class SearchDialog extends Dialog
{
    constructor(words){
        super()
        this.words = words
        this.desc = ''
        this.expSearch = ''
        this.expRegex = ''
        this.highlight = ''
        this.condition = ''
        this.color = ''
        this.regexUl = ''
        this.highlightUl = ''
        this.conditionUl = ''

        this.textArea = ''
        this.regexArea = ''
        this.returnArea = ''

        this.tablinks = document.createElement('div')
        this.tabcontents = document.createElement('div')
        this.container.appendChild(this.tablinks)
        this.container.appendChild(this.tabcontents)
        this.modal.appendChild(this.container)
        this.searchDialogInit()
    }

    searchDialogInit(){
        let that = this

        /************************************SEARCH TAB*************************************/
        var searchContent = document.createElement('div')
        searchContent.style.display = 'block'
        // search title
        var searchTitle = document.createElement('button')
        searchTitle.style.backgroundColor = '#333'
        searchTitle.style.color = 'white'
        searchTitle.style.border = 'none'
        searchTitle.style.cursor = 'pointer'
        searchTitle.style.padding = '10px 16px'
        searchTitle.style.fontSize = '16px'
        searchTitle.style.width = '50%'
        searchTitle.innerHTML = 'SEARCH'
        searchTitle.addEventListener('click', function()
        {
            searchContent.style.display = 'block'
            searchTitle.style.backgroundColor = '#333'
            regexContent.style.display = 'none'
            regexTitle.style.backgroundColor = '#999'
        })

        // search description
        var descL = document.createElement('h4')
        descL.innerHTML = 'Search Description'
        this.desc = document.createElement('input')
        this.desc.spellcheck = false
        this.desc.type = 'text'

        // search express 
        var expSearchL = document.createElement('h4')
        expSearchL.innerHTML = 'Search Express'
        this.expSearch = new InputDropDown(this.words)

        // regex express
        var expRegexL = document.createElement('h4')
        expRegexL.innerHTML = 'Key Value Extract Regex Express'
        this.expRegex = document.createElement('input')
        this.expRegex.style.width = '85%'
        this.expRegex.spellcheck = false
        this.expRegex.type = 'text'
        var addRegex = document.createElement('button')
        addRegex.style.width = '15%'
        addRegex.innerHTML = 'ADD'
        addRegex.onclick = function(){that.addRegexItem()}
        this.regexUl = document.createElement('ul')

        // highlight items
        var highlightL = document.createElement('h4')
        highlightL.innerHTML = 'Highlight Word(comma separation between words)'
        this.highlight = document.createElement('input')
        this.highlight.style.width = '75%'
        this.highlight.spellcheck = false
        this.highlight.type = 'text'
        this.color = document.createElement('input')
        this.color.type = 'color'
        var addHighlight = document.createElement('button')
        addHighlight.style.width = '15%'
        addHighlight.innerHTML = 'ADD'
        addHighlight.onclick = function(){that.addHighlightItem()}
        this.highlightUl = document.createElement('ul')

        // condition items
        var conditionL = document.createElement('h4')
        conditionL.innerHTML = 'Condition Judge'
        this.condition = document.createElement('input')
        this.condition.style.width = '85%'
        this.condition.spellcheck = false
        this.condition.type = 'text'
        var addCondition = document.createElement('button')
        addCondition.style.width = '15%'
        addCondition.innerHTML = 'ADD'
        addCondition.onclick = function(){that.addConditionItem()}
        this.conditionUl = document.createElement('ul')

        // search and cancel button
        var apply = document.createElement('button')
        apply.innerHTML = 'SEARCH'
        apply.onclick = function(){that.search(function() {})}
        var cancel = document.createElement('button')
        cancel.style.backgroundColor = 'red'
        cancel.innerHTML = 'CANCEL'
        cancel.onclick = function(){that.close()}

        searchContent.appendChild(descL)
        searchContent.appendChild(this.desc)
        searchContent.appendChild(expSearchL)
        searchContent.appendChild(this.expSearch.box)

        searchContent.appendChild(expRegexL)
        searchContent.appendChild(this.expRegex)
        searchContent.appendChild(addRegex)
        searchContent.appendChild(this.regexUl)

        searchContent.appendChild(highlightL)
        searchContent.appendChild(this.highlight)
        searchContent.appendChild(this.color)
        searchContent.appendChild(addHighlight)
        searchContent.appendChild(this.highlightUl)

        searchContent.appendChild(apply)
        searchContent.appendChild(cancel)

        this.tablinks.appendChild(searchTitle)
        this.tabcontents.appendChild(searchContent)

        /************************************REGEX TEST TAB*************************************/
        var regexContent = document.createElement('div')
        regexContent.style.display = 'none'
        // regex title
        var regexTitle = document.createElement('button')
        regexTitle.style.backgroundColor = '#999'
        regexTitle.style.color = 'white'
        regexTitle.style.border = 'none'
        regexTitle.style.cursor = 'pointer'
        regexTitle.style.padding = '10px 16px'
        regexTitle.style.fontSize = '16px'
        regexTitle.style.width = '50%'
        regexTitle.innerHTML = 'REGEX TEXT'
        regexTitle.addEventListener('click', function()
        {
            searchContent.style.display = 'none'
            searchTitle.style.backgroundColor = '#999'
            regexContent.style.display = 'block'
            regexTitle.style.backgroundColor = '#333'
        })

        var textL = document.createElement('h4')
        textL.innerHTML = 'Input Text'
        this.textArea = document.createElement('textarea')
        this.textArea.rows = '5'
        this.textArea.cols = '1000'
        this.textArea.placeholder = 'Input Text'
        this.textArea.style.width = '100%'
        this.textArea.style.padding = '12px 20px'
        this.textArea.style.margin = '8px 0'
        this.textArea.style.display = 'inline-block'
        this.textArea.style.border = '1px solid #ccc'
        this.textArea.style.boxSizing= 'border-box'
        this.textArea.spellcheck = false

        var regexL = document.createElement('h4')
        regexL.innerHTML = 'Input Regex'
        this.regexArea = document.createElement('textarea')
        this.regexArea.rows = '5'
        this.regexArea.cols = '1000'
        this.regexArea.placeholder = 'Input Regex Express'
        this.regexArea.style.width = '100%'
        this.regexArea.style.padding = '12px 20px'
        this.regexArea.style.margin = '8px 0'
        this.regexArea.style.display = 'inline-block'
        this.regexArea.style.border = '1px solid #ccc'
        this.regexArea.style.boxSizing= 'border-box'
        this.regexArea.spellcheck = false

        var returnL = document.createElement('h4')
        returnL.innerHTML = 'Return Result'
        this.returnArea = document.createElement('textarea')
        this.returnArea.rows = '5'
        this.returnArea.cols = '1000'
        this.returnArea.placeholder = 'Return Result'
        this.returnArea.style.width = '100%'
        this.returnArea.style.padding = '12px 20px'
        this.returnArea.style.margin = '8px 0'
        this.returnArea.style.display = 'inline-block'
        this.returnArea.style.border = '1px solid #ccc'
        this.returnArea.style.boxSizing= 'border-box'
        this.returnArea.spellcheck = false

        // test button
        var test = document.createElement('button')
        test.innerHTML = 'TEST'
        test.onclick = function(){that.regexTest()}
        var cancel2 = document.createElement('button')
        cancel2.style.backgroundColor = 'red'
        cancel2.innerHTML = 'CANCEL'
        cancel2.onclick = function(){that.close()}

        regexContent.appendChild(textL)
        regexContent.appendChild(this.textArea)
        regexContent.appendChild(regexL)
        regexContent.appendChild(this.regexArea)
        regexContent.appendChild(returnL)
        regexContent.appendChild(this.returnArea)
        regexContent.appendChild(test)
        regexContent.appendChild(cancel2)

        this.tablinks.appendChild(regexTitle)
        this.tabcontents.appendChild(regexContent)
    }

    async search(){
    }

    addRegexItem(){
        let that = this
        var li = document.createElement("li")
        // li.style.listStyleType = 'none'

        var t = document.createElement("input");
        t.setAttribute('type', "text")
        t.setAttribute('value', this.expRegex.value)
        t.style.width = '92%'
        var x = document.createElement("button")
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.innerHTML = 'X'
        x.onclick = function(){that.deleteItem(x)}

        li.appendChild(t)
        li.appendChild(x)
        this.regexUl.append(li)
    }

    addHighlightItem(){
        let that = this
        var li = document.createElement("li")
        // li.style.listStyleType = 'none'

        var t = document.createElement("input");
        t.setAttribute('type', "text")
        t.setAttribute('value', this.highlight.value)
        t.style.width = '82%'
        var c = document.createElement("input")
        c.setAttribute('type', "color")
        c.setAttribute('value', this.color.value)
        var x = document.createElement("button")
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.onclick = function(){that.deleteItem(x)}
        x.innerHTML = 'X'

        li.appendChild(t)
        li.appendChild(c)
        li.appendChild(x)
        this.highlightUl.append(li)
    }

    addConditionItem(){
        let that = this
        var li = document.createElement("li")
        // li.style.listStyleType = 'none'

        var t = document.createElement("input");
        t.setAttribute('type', "text")
        t.setAttribute('value', this.condition.value)
        t.style.width = '92%'
        var x = document.createElement("button")
        x.style.width = '8%'
        x.style.backgroundColor = 'red'
        x.innerHTML = 'X'
        x.onclick = function(){that.deleteItem(x)}

        li.appendChild(t)
        li.appendChild(x)
        this.conditionUl.append(li)
    }

    deleteItem(b){
        common.removeAll(b.parentNode)
    }

    regexTest(){
        service.emit('regex_test', {'text':this.textArea.value, 'regex':this.regexArea.value}, (res) => {
            if (res['status'] == 'error') {
                alert(res.msg)
            }else{
                this.returnArea.value = res.msg.join('\n')
            }
        })
    }
}

class ChartDialog extends Dialog
{
    constructor(parent, position){
        super()
        this.register(position)
        this.parent = parent
        this.desc = ''
        this.chartDialogInit()
    }

    register(position){
        position.append(this.modal)
    }

    chartDialogInit(){
        let that = this

        var descL = document.createElement('h4')
        descL.innerHTML = 'Title'
        this.desc = document.createElement('input')
        this.desc.spellcheck = false
        this.desc.type = 'text'

        // search and cancel button
        var apply = document.createElement('button')
        apply.innerHTML = 'APPLY'
        apply.onclick = function(){that.apply()}
        var cancel = document.createElement('button')
        cancel.style.backgroundColor = 'red'
        cancel.innerHTML = 'CANCEL'
        cancel.onclick = function(){that.close()}

        this.container.appendChild(descL)
        this.container.appendChild(this.desc)
        this.container.appendChild(apply)
        this.container.appendChild(cancel)
        this.modal.appendChild(this.container)
    }

    apply(){
        this.parent.applyConfig()
    }
}

class WorkFlowDialog extends Dialog
{
    constructor(parent, position){
        super()
        this.register(position)
        this.parent = parent
        this.dir = ''
        this.themePath = ''
        this.workFlowDialogInit()
    }

    register(position){
        position.append(this.modal)
    }

    workFlowDialogInit(){
        let that = this

        // Files Directory
        var dirL = document.createElement('h4')
        dirL.innerHTML = 'Files Directory'
        this.dir = document.createElement('input')
        this.dir.spellcheck = false
        this.dir.style.width = '85%'
        this.dir.type = 'text'
        var browseDir = document.createElement('button')
        browseDir.style.width = '15%'
        browseDir.innerHTML = 'BROWSE'
        browseDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.dir.value = path
            })
        }

        // Theme path
        var themePathL = document.createElement('h4')
        themePathL.innerHTML = 'Theme Path'
        this.themePath = document.createElement('input')
        this.themePath.spellcheck = false
        this.themePath.style.width = '85%'
        this.themePath.type = 'text'
        var browseThenme = document.createElement('button')
        browseThenme.style.width = '15%'
        browseThenme.innerHTML = 'BROWSE'
        browseThenme.onclick = function(){that.browseTheme()}

        // search and cancel button
        var apply = document.createElement('button')
        apply.innerHTML = 'RUN'
        apply.onclick = function(){that.apply()}
        var cancel = document.createElement('button')
        cancel.style.backgroundColor = 'red'
        cancel.innerHTML = 'CANCEL'
        cancel.onclick = function(){that.close()}

        this.container.appendChild(dirL)
        this.container.appendChild(this.dir)
        this.container.appendChild(browseDir)

        this.container.appendChild(themePathL)
        this.container.appendChild(this.themePath)
        this.container.appendChild(browseThenme)

        this.container.appendChild(apply)
        this.container.appendChild(cancel)
        this.modal.appendChild(this.container)
    }

    async browseTheme(){
        let content = await ipcRenderer.invoke('import-theme')
        this.themePath.value = content[0]
    }

    apply(){
        let that = this
        fs.readdir(this.dir.value, (err, files) => {
            var res = []
            files.forEach(file => {
                res.push(that.dir.value + '\\' + file)
            });
            that.parent.workFlowApply(res, that.themePath.value)
        })
        this.close()
    }
}

class DCGMAnalysisDialog extends Dialog
{
    constructor(parent, position){
        super()
        this.register(position)
        this.parent = parent
        this.dcgmDir = ''
        this.saveDir = ''
        this.telogFilter = ''
        this.elogFilter = ''
        this.DCGMAnalysisDialogInit()
    }

    register(position){
        position.append(this.modal)
    }

    DCGMAnalysisDialogInit(){
        let that = this

        // DCGM Directory
        var dcgmDirL = document.createElement('h4')
        dcgmDirL.innerHTML = 'DCGM Directory'
        this.dcgmDir = document.createElement('input')
        this.dcgmDir.spellcheck = false
        this.dcgmDir.style.width = '85%'
        this.dcgmDir.type = 'text'
        var browseDcgmDir = document.createElement('button')
        browseDcgmDir.style.width = '15%'
        browseDcgmDir.innerHTML = 'BROWSE'
        browseDcgmDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.dcgmDir.value = path
            })
        }

        // Save Directory
        var saveDirL = document.createElement('h4')
        saveDirL.innerHTML = 'Save Directory'
        this.saveDir = document.createElement('input')
        this.saveDir.spellcheck = false
        this.saveDir.style.width = '85%'
        this.saveDir.type = 'text'
        var browseSaveDir = document.createElement('button')
        browseSaveDir.style.width = '15%'
        browseSaveDir.innerHTML = 'BROWSE'
        browseSaveDir.onclick = function(){
            that.browseFilesDirectory(function(path) {
                that.saveDir.value = path
            })
        }

        // Filter condition
        var telogFilterL = document.createElement('h4')
        telogFilterL.innerHTML = 'Optional: Telog Filter Condition(Case sensitive, Comma delimited)'
        this.telogFilter = document.createElement('input')
        this.telogFilter.spellcheck = false
        this.telogFilter.style.width = '100%'
        this.telogFilter.type = 'text'
        var elogFilterL = document.createElement('h4')
        elogFilterL.innerHTML = 'Optional: Elog Filter Condition(Case sensitive, Comma delimited)'
        this.elogFilter = document.createElement('input')
        this.elogFilter.spellcheck = false
        this.elogFilter.style.width = '100%'
        this.elogFilter.type = 'text'

        // search and cancel button
        var apply = document.createElement('button')
        apply.innerHTML = 'RUN'
        apply.onclick = function(){that.apply()}
        var cancel = document.createElement('button')
        cancel.style.backgroundColor = 'red'
        cancel.innerHTML = 'CANCEL'
        cancel.onclick = function(){that.close()}

        this.container.appendChild(dcgmDirL)
        this.container.appendChild(this.dcgmDir)
        this.container.appendChild(browseDcgmDir)

        this.container.appendChild(saveDirL)
        this.container.appendChild(this.saveDir)
        this.container.appendChild(browseSaveDir)

        this.container.appendChild(telogFilterL)
        this.container.appendChild(this.telogFilter)
        this.container.appendChild(elogFilterL)
        this.container.appendChild(this.elogFilter)

        this.container.appendChild(apply)
        this.container.appendChild(cancel)
        this.modal.appendChild(this.container)
    }

    apply(){
        this.parent.dcgmAnalysisApply()
    }
}

class ShareDownloadDialog extends Dialog
{
    constructor(position){
        super()
        this.register(position)
        this.themes = []
        this.ShareDownloadDialogInit()
    }

    register(position){
        position.append(this.modal)
    }

    async ShareDownloadDialogInit(){
        let that = this

        await http.get(urls.query_themes, {
            params: {
            },
            })
          .then(response => {
            this.themes = response.data.themes
            this.themes.forEach((theme) => {
                var div = document.createElement("div")
                div.style.width = '100%'
                div.style.display = 'block'
                div.style.position = 'relative'
                var input = document.createElement("input")
                input.style.float = 'left'
                input.style.cursor = 'pointer'
                input.type = 'radio'
                input.value = theme
                input.name = 'share-download'
                var label = document.createElement("h4")
                label.style.color = '#FFF'
                label.innerHTML = theme
                div.appendChild(input)
                div.appendChild(label)
                this.container.appendChild(div)
            })

            var download = document.createElement('button')
            download.style.width = "33%"
            download.innerHTML = 'DOWNLOAD'
            download.onclick = function(){that.download()}
            var refresh = document.createElement('button')
            refresh.style.width = "33%"
            refresh.innerHTML = 'REFRESH'
            refresh.onclick = function(){that.refresh()}
            var cancel = document.createElement('button')
            cancel.style.width = "33%"
            cancel.style.backgroundColor = 'red'
            cancel.innerHTML = 'CANCEL'
            cancel.onclick = function(){that.close()}

            this.container.appendChild(download)
            this.container.appendChild(refresh)
            this.container.appendChild(cancel)
            this.modal.appendChild(this.container)
            })
            .catch(function (error) {
                alert('Can not link to sharing service!')
                that.close()
            })
    }

    async download(){
        if (process.env.NODE_ENV == 'development'){
            await ipcRenderer.invoke('downloadURL', {url:`http://localhost:8001/download_theme/${this.container.querySelector('input[name="share-download"]:checked').value}`})
        }else{
            await ipcRenderer.invoke('downloadURL', {url:`http://10.166.152.87/share/download_theme/${this.container.querySelector('input[name="share-download"]:checked').value}`})
        }
    }

    refresh(){
        common.removeAllChild(this.container)
        this.ShareDownloadDialogInit()
    }
}

class VideoDialog extends Dialog
{
    constructor(position){
        super()
        this.register(position)
        // this.position = position
        this.player = ''
        this.videoDialogInit("http://localhost:8001/display/test.mp4")
    }

    register(position){
        position.append(this.modal)
    }

    videoDialogInit(){
        this.modal.className = ''
        this.container.className = ''
        this.container.style.backgroundColor = '#000'

        var video = document.createElement('video')
        video.setAttribute('id', 'videoPlayer')
        video.setAttribute('class', 'video-js vjs-default-skin')
        video.setAttribute('controls', true)
        video.setAttribute('preload', 'auto')
        video.setAttribute('data-setup', '{}')
        video.style.textAlign = 'center'
        this.container.appendChild(video)

        this.player = videojs('videoPlayer')
        var CloseButton = videojs.getComponent('CloseButton')
        CloseButton.prototype.handleClick = () => this.onClose()
        var closeButton = new CloseButton(this.player )
        this.player.addChild(closeButton)
    }

    play(videoPath){
        var url = ''
        if (process.env.NODE_ENV == 'development'){
            url = 'http://localhost:8001/'
        }else{
            url = 'http://10.166.152.87/share/'
        }
        url = url+'display/'+videoPath
        this.player.src({src: url, type: "video/mp4"})
    }

    onClose(){
        this.player.pause()
        this.close()
    }
}

export {SearchDialog, ChartDialog, WorkFlowDialog, DCGMAnalysisDialog, ShareDownloadDialog, VideoDialog}