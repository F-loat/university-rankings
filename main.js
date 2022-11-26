// ==UserScript==
// @name         University rankings
// @namespace    https://stardust.ai/
// @description  Draw words to query university rankings
// @version      0.1
// @include      *
// @grant        GM_xmlhttpRequest
// @connect      daxue.menggy.com
// @author       maoyuan.chai
// @license      MIT
// ==/UserScript==

import { load } from 'cheerio'

const fetch = (url) => new Promise((resolve, reject) => {
  GM_xmlhttpRequest({
    method: 'GET',
    url,
    onload(xhr) {
      resolve(xhr.responseText);
    },
    onerror: reject
  }); 
});

const getUid = (name) => fetch(`https://daxue.menggy.com/api/search?q=${name}`)
  .then(res => JSON.parse(res))
  .then(res => res.schools[0]?.id)

const getRanking = (uid) => fetch(`https://daxue.menggy.com/s/${uid}/*`)
  .then(res => {
    const $ = load(res)
    const [ranking] = $('.tab-pane > .row:first-child > div >.list-group-item')
    const rankingType = $('h2 > a', ranking).text()
    const rankingValue = $('div > a', ranking).text()
    const rankingText = `${rankingType} ${rankingValue}`
    return rankingText;
  })

const setSelection = (text) => {
  const selecter = window.getSelection()
  const rang = selecter.getRangeAt(0)
  const temp = document.createElement('b')
  rang.surroundContents(temp)
  rang.deleteContents()
  rang.insertNode(document.createTextNode(text))
}

let timer = null

document.addEventListener('selectionchange', function(e) {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    const selecter = window.getSelection()
    const selectedText = selecter.toString().trim()
    if (selecter.isCollapsed || !/[大学｜学院]$/.test(selectedText)) return
    try {
      setSelection(`${selectedText}（加载中）`)
      const result = await getUid(selectedText).then(getRanking)
      setSelection(`${selectedText}（${result}）`)
    } catch (err) {
      console.log(err)
      setSelection(`${selectedText}（加载失败）`)
    }
  }, 500)
});
