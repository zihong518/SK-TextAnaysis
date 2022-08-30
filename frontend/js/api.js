// api
const Request = axios.create({
  // baseURL: 'https://sk-platform-backend.azurewebsites.net',
  baseURL: 'http://127.0.0.1:5000/',
})

// User 相關的 api
export const getWordCloud = (data) => Request.get(`/getCloud?name=${data.bank}&dataProduct=${data.product}&dataSource=${data.source}&dateStart=${data.dateStart}&dateEnd=${data.dateEnd}&content=${data.content}`)
export const getWordCount = (data) => Request.get(`/getCount?name=${data.bank}&content=${data.content}&dataProduct=${data.product}&dataSource=${data.source}`)

export const getDateRange = (type) => Request.get(`/getDateRange?type=${type}`)
export const getWordProportion = (data) => Request.get(`/getProportion?keywordA=${data.keywordA}&keywordB=${data.keywordB}&content=${data.content}&dataProduct=${data.product}&dataSource=${data.source}`)
export const getSent = (data) => Request.get(`/getSent?name=${data.bank}&content=${data.content}&dataProduct=${data.product}&dataSource=${data.source}`)
export const getSentWord = (data) => Request.get(`/getSentWord?name=${data.bank}&content=${data.content}&dataProduct=${data.product}&dataSource=${data.source}`)
export const getSentDict = () => Request.get(`/getSentDict`)
export const getNgram = (data, n) => Request.get(`/getNgram?topic=${data.topic}&keyword=${data.keyword}&dateStart=${data.dateStart}&dateEnd=${data.dateEnd}&dataProduct=${data.product}&dataSource=${data.source}&content=${data.content}&n=${n}`)
