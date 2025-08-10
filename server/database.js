var mongoose = require('mongoose')
var dotenv = require('dotenv')

dotenv.config()

mongoose.connect(process.env.mongodb_url).then(()=>{
    console.log("Database Connected")
}).catch((error)=>{
    console.log(error)
})