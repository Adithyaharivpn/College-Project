const express = require('express')
var dotenv = require('dotenv')
require('./database')
dotenv.config()
const port = process.env.port

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
