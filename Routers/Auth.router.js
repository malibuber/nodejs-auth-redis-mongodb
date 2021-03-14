const express = require("express")
const router = express.Router()
const createError = require("http-errors")
const User = require("../Models/User.model")
const {authSchema} = require("../helpers/validation_schema")
const { signAccessToken ,signRefreshToken, verifyRefreshToken} = require('../helpers/jwt_helper')
const client = require("../helpers/init_redis")

router.post("/register" ,async(req,res,next)=>{
    try{
        const {email, password} = req.body
        const result = await authSchema.validateAsync(req.body)
 

        const doesExit = await User.findOne({email: result.email})
        if (doesExit) throw createError.Conflict(`${result.email} is already registered`)

        const user = new User(result)
        const saveUser = await user.save()
        const accessToken = await signAccessToken(saveUser.id)
        const refreshToken = await signRefreshToken(saveUser.id)
        res.send({accessToken, refreshToken})

    }catch(error){
        if (error.isJoi === true) error.status =422
        next(error)
    }
})


router.post("/login" ,async(req,res,next)=>{
    try{
        const result = await authSchema.validateAsync(req.body)
        const user = await User.findOne({email: result.email})
        if(!user) throw createError.NotFound("user not registered")

        const isMatch = await user.isValidPassword(result.password)
        if(!isMatch) throw createError.Unauthorized("username or password not valid")

        const accessToken = await signAccessToken(user.id)
        const refreshToken = await signRefreshToken(user.id)
        res.send({accessToken, refreshToken})

    }catch(error){
        if (error.isJoi === true) return next(createError.BadRequest("invalid password or email"))
        next(error)
    }
})


router.post("/refresh-token" ,async(req,res,next)=>{
    try {
        const { refreshToken } = req.body
        if (!refreshToken) throw createError.BadRequest()
        const userId = await verifyRefreshToken(refreshToken)
  
        const accessToken = await signAccessToken(userId)
        const refToken = await signRefreshToken(userId)
        res.send({ accessToken: accessToken, refreshToken: refToken })
      } catch (error) {
        next(error)
      }
})


router.delete("/logout" ,async(req,res,next)=>{
    try {
        const { refreshToken } = req.body
        if(!refreshToken) throw createError.BadRequest()
        const userID = await verifyRefreshToken(refreshToken)
        client.DEL(userID,(err,val)=>{
            if(err){
                console.log(err.message)
                throw createError.InternalServerError()
            }
            console.log(val)
            res.sendStatus(204)
        })
    } catch (error) {
        next(error)
    }
})







module.exports = router