import express from 'express'
import bodyParser from 'body-parser'
import {dirname} from 'path'
import DataBaseHandler from './dataBaseHandler.mjs'
import { fileURLToPath } from 'url'
import cors from 'cors'
import { createServer } from 'http'
import morgan from 'morgan'
import { Server } from 'socket.io'

// create express js app
const app = express()
// url for associated mongodb database
const databaseURL = "mongodb+srv://test_123:HZheHQXdKAV1pO3h@cst3144.lxvfe.mongodb.net/?retryWrites=true&w=majority&appName=CST3144"
// create an instantiation of the DatabaseHandler custom class
const db = new DataBaseHandler(databaseURL)
const portNumber = 5174
const rootDir = dirname(fileURLToPath(import.meta.url))

// middleware to parse request bodies from json format to javascript objects
app.use(bodyParser.json())

// middleware to log the various connections and communications to and from the server
app.use((morgan('tiny')))

// middleware to allow cross reference communication or communication across two different domains
app.use(cors())

//images folder made available to public
app.use(express.static("images"))

// api endpoint to return all lessons in the database to the requester
app.get("/lessons", (req, res)=>{
    db.parse(db.code.getLessons, req, res)
})

// api endpoint to store a newly created order object in the databas
app.post("/order", (req, res)=>{
    db.parse(db.code.order, req, res)
})

// api endpoint to update
app.put("/update", (req, res)=>{
    db.parse(db.code.update, req, res)
})

console.log("[+] Server running on port:"+portNumber)
const httpServer = app.listen(portNumber)
//const server = createServer(app)
const io = new Server(httpServer)

io.on("connect", (client)=>{
    console.log("Connected with socket: "+client.id)
    client.on("search", async(searchTerm)=>{
        console.log(searchTerm)
        let results = await db.parse(db.code.search, searchTerm, null)
        console.log(results)
        let arrCopy = [...results]
        io.emit("found", arrCopy)
    })
})


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