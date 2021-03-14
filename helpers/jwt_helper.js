const jwt = require("jsonwebtoken")
const createError = require("http-errors")
const client = require("./init_redis")

module.exports = {
    signAccessToken: (userID) =>{
        return new Promise((resolve,reject)=> {
            const payload = {}
            const secret = process.env.ACCESS_TOKEN_SECRET
            const options = {
                expiresIn: "15s",
                issuer : "google.com",
                audience: userID
            }
            jwt.sign(payload,secret,options,(err,token) =>{
                if (err) {
                    console.log(err.message)
                    reject(createError.InternalServerError())
                }
                resolve(token)
            })
        })
    },
    verifyAccessToken: (req, res, next) => {
        if (!req.headers['authorization']) return next(createError.Unauthorized())
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
          if (err) {
            const message = err.name === "JsonWebTokenError" ? "Unauthorized" : err.message
            return next(createError.Unauthorized(message))
          }
          req.payload = payload
          next()
        })
      },
    signRefreshToken: (userID) =>{
        return new Promise((resolve,reject)=> {
            const payload = {}
            const secret = process.env.REFRESH_TOKEN_SECRET
            const options = {
                expiresIn: "1y",
                issuer : "google.com",
                audience: userID
            }
            jwt.sign(payload,secret,options,(err,token) =>{
                if (err) {
                    console.log(err.message)
                    reject(createError.InternalServerError())
                }
                client.set(userID, token, "EX", 365*60*24*60 ,(err,replay)=> {
                    if(err) {
                        console.log(err.message)
                        reject(createError.InternalServerError)
                        return
                    }
                })
                resolve(token)
            })
        })
    },
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
          jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, payload) => {
              if (err) return reject(createError.Unauthorized())
              const userId = payload.aud
              client.GET(userId, (err, result) => {
                if (err) {
                  console.log(err.message)
                  reject(createError.InternalServerError())
                  return
                }
                if (refreshToken === result) return resolve(userId)
                reject(createError.Unauthorized())
              })
            }
          )
        })
      },
} 