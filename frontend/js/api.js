// api
const Request = axios.create({
  baseURL: 'http://127.0.0.1:5000/',
})

// User 相關的 api
export const getWordCloud = (data) => Request.get(`/getCloud?name=${data.bank}&dateStart=${data.dateStart}&dateEnd=${data.dateEnd}&content=${data.content}`)
export const getWordCount = (data) => Request.get(`/getCount?name=${data.bank}&content=${data.content}`)

export const getDateRange = () => Request.get('/getDateRange')
export const getWordProportion = (data) => Request.get(`/getProportion?keywordA=${data.keywordA}&keywordB=${data.keywordB}&content=${data.content}`)
export const getSent = (data) => Request.get(`/getSent?name=${data.bank}&content=${data.content}`)
export const getSentWord = (data) => Request.get(`/getSentWord?name=${data.bank}&content=${data.content}`)
export const getSentDict = () => Request.get(`/getSentDict`)
