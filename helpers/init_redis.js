const redis = require("redis")

const client = redis.createClient({
    port : 6379,
    host: "127.0.0.1"
})

client.on("connect", () =>{
    console.log("connect")
})

client.on("ready", () =>{
    console.log("ready")
})


client.on("error", (err) =>{
    console.log(err.message)
})

client.on("end", () =>{
    console.log("end")
})

process.on("SIGINT", () =>{
    client.quit()
})

module.exports = client