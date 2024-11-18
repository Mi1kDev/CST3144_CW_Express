import express from 'express'
import bodyParser from 'body-parser'
import {dirname} from 'path'
import DataBaseHandler from './dataBaseHandler.mjs'
import { fileURLToPath } from 'url'

const app = express()
const databaseURL = "mongodb+srv://test_123:HZheHQXdKAV1pO3h@cst3144.lxvfe.mongodb.net/?retryWrites=true&w=majority&appName=CST3144"
const db = new DataBaseHandler(databaseURL)
const portNumber = 5174
const rootDir = dirname(fileURLToPath(import.meta.url))

app.use(bodyParser.json())

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

//images folder made available to public
app.use(express.static("images"))

app.get("/lessons", (req, res)=>{
    db.parse(db.code.getLessons, req, res)
})

app.post("/order", (req, res)=>{
    db.parse(db.code.order, req, res)
})

app.put("/update/:lessonId-:qty", (req, res)=>{
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