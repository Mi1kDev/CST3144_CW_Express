import express from 'express'
import bodyParser from 'body-parser'
import {dirname} from 'path'
import DataBaseHandler from './dataBaseHandler.mjs'
import { fileURLToPath } from 'url'
import cors from 'cors'
import morgan from 'morgan'

const app = express()
const databaseURL = "mongodb+srv://test_123:HZheHQXdKAV1pO3h@cst3144.lxvfe.mongodb.net/?retryWrites=true&w=majority&appName=CST3144"
const db = new DataBaseHandler(databaseURL)
const portNumber = 5174
const rootDir = dirname(fileURLToPath(import.meta.url))

app.use(bodyParser.json())

app.use((morgan('tiny')))

app.use(cors())

//images folder made available to public
app.use(express.static("images"))

// display error message for unfound files
// app.use((err, req, res, next)=>{
//     if(err.statusCode === 404){
//         console.log("[!] Image not located")
//         res.status(404).send("Image not found!");
//     }else{
//         next(err)
//     }
// })

app.get("/lessons", (req, res)=>{
    db.parse(db.code.getLessons, req, res)
})

app.post("/order", (req, res)=>{
    db.parse(db.code.order, req, res)
})

app.put("/update/", (req, res)=>{
    db.parse(db.code.update, req, res)
})

console.log("[+] Server running at localhost:"+portNumber)
app.listen(portNumber)

process.on("SIGINT", async()=>{
    try{
        await db.terminateConnection()
    }catch(err){
        console.log(err)
    }finally{
        console.log("[!] Terminating database connection")
        process.exit()
    }
    
})