const mongoose = require("mongoose")
require("dotenv").config()

mongoose.connect(process.env.DATABASE_URL, {
    dbName: process.env.DB_NAME,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
    })
    .then(()=>{
        console.log("database cooncetinon")
    })
.catch(err => console.log(err.message))


mongoose.connection.on("connected", ()=>{
    console.log("mongoose connect to db")
})

mongoose.connection.on("error", (err)=>{
    console.log(err.message)
})

mongoose.connection.on("disconnected", () =>{
    console.log("mongoose connection is disconnected")
})

process.on('SIGINT', async() => {
    await mongoose.connection.close()
    process.exit(0)
})