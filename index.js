const axios = require('axios')
require('dotenv').config()

/**
 * Subarray size
 * @type {number}
 */
const size = 100
/**
 * Delay between requests
 * @type {number}
 */
const delay = 500
/**
 * Host for requests
 * @type {string}
 */
const baseURL = 'http://localhost:5000'

/**
 * Endpoint to get a list of records
 * @type {string}
 */
const getListAddr = `${baseURL}/api/carwash-stat/payment?_end=1000000&_order=ASC&_sort=id&_start=0`
// const getListAddr = `${baseURL}/api/carwash-stat/event?_end=1000000&_order=ASC&_sort=id&_start=0`
/**
 * Endpoint to update a record
 * @type {string}
 */

const updateListAddr = `${baseURL}/api/carwash-stat/payment/`
// const updateListAddr = `${baseURL}/api/carwash-stat/event/`

/**
 * Just waits for a given amount of time. By default 500 ms
 * @param ms
 * @returns {Promise<unknown>}
 */
const sleep = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
/**
 * Divides the provided array into groups of subarrays according to a given size
 * @param arr
 * @param size
 * @returns {boolean|[]}
 */
const splitArray = (arr, size) => {
  if (!arr || arr.length === 0 || !size || size === 0) return false
  const subArray = []
  for (let i = 0; i < Math.ceil(arr.length / size); i++) {
    subArray[i] = arr.slice((i * size), (i * size) + size)
  }
  return subArray
}
/**
 * - 3 hours from provided date
 * @param date
 * @returns {string} date as ISO string
 */
const editTime = (date) => {
  const timestamp = new Date(date).getTime()
  const newTimestamp = timestamp - (3 * 60 * 60 * 1000)
  return new Date(newTimestamp).toISOString()
}
/**
 * Send request for update provided entry
 * @param dbId
 * @param token
 * @param dateTime
 * @returns {Promise<unknown>}
 */
const updateData = async (dbId, token, dateTime) => {
  return new Promise(async (resolve, reject) => {
    try{
      await axios.put(updateListAddr + dbId, {
        dateTime: editTime(dateTime)
      },{
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      resolve()
    } catch(error){
      reject(`db id ${dbId} error: `,error)
    }
  })
}
/**
 * Ensures correct processing of asynchronous requests for a given array
 * @param arr
 * @param token
 * @returns {Promise<unknown>}
 */
const editDate = (arr, token) => {
  return new Promise(async (resolve, reject) => {
    const subArray = splitArray(arr, size)
    console.log(`3 step: the list of records has been splitted, total records is `, arr.length)
    if (!subArray) return reject('error')
    let currentIndex = 0
    console.log('4 step: sending request for update provided entry..')
    while (currentIndex < subArray.length) {
      try{
        await sleep(delay)
        await Promise.all(subArray[currentIndex].map(async item => {
          await updateData(item.id, token, item.dateTime)
        }))
        console.log(`- group ${currentIndex + 1} is done`)
        currentIndex++
      } catch(error){
        reject(error)
      }
    }
    resolve()
  })
}

;(async() => {
  try{
    const token = await axios.post('http://localhost:5000/api/carwash-stat/auth/login', {
      "username": process.env.USERNAME,
      "password": process.env.PASSWORD
    })
    console.log('1 step: token received')
    const dbResult = await axios.get(getListAddr, {
      headers: {
        'Authorization': `Bearer ${token.data.access_token}`
      }
    })
    console.log('2 step: a list of records received')
    await editDate(dbResult.data, token.data.access_token)
    console.log('job done!')
  } catch(error){
    console.log(error)
  }
})()