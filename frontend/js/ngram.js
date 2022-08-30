import { getNgram } from './api.js'

function Ngram(filter) {
  getNgram(filter, 2).then((res) => {
    document.getElementById('bigram-loading').firstChild.remove()
    const data = res.data.slice(0, 10).map((x) => {
      const word = x.word.split(' ')
      return {
        wordA: word[0],
        wordB: word[1],
        count: x.counts,
      }
    })
    const tableContent = document.getElementById('bigram-body')
    let content = ''
    data.forEach((element) => {
      content += `
     <tr>
      <td>${element.wordA}</td>
      <td>${element.wordB}</td>
      <td>${element.count}</td>
    </tr>
    `
    })
    tableContent.innerHTML = content
  })
  getNgram(filter, 3).then((res) => {
    document.getElementById('trigram-loading').firstChild.remove()
    const data = res.data.slice(0, 10).map((x) => {
      const word = x.word.split(' ')
      return {
        wordA: word[0],
        wordB: word[1],
        wordC: word[2],
        count: x.counts,
      }
    })
    const tableContent = document.getElementById('trigram-body')
    let content = ''
    data.forEach((element) => {
      content += `
     <tr>
      <td>${element.wordA}</td>
      <td>${element.wordB}</td>
      <td>${element.wordC}</td>

      <td>${element.count}</td>
    </tr>
    `
    })
    tableContent.innerHTML = content
  })
}

export default Ngram
