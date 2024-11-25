import express from 'express'
import bodyParser from 'body-parser'
import DataBaseHandler from './dataBaseHandler.mjs'
import cors from 'cors'
import morgan from 'morgan'
import 'dotenv/config.js'
import { Server } from 'socket.io'

// create express js app
const app = express()
// url for associated mongodb database
const username = process.env.DB_USERNAME
const password = process.env.DB_PASSWORD
const databaseURL = `mongodb+srv://${username}:${password}@cst3144.lxvfe.mongodb.net/?retryWrites=true&w=majority&appName=CST3144`
console.log(databaseURL)
// create an instantiation of the DatabaseHandler custom class
const db = new DataBaseHandler(databaseURL)
const portNumber = 5174

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

app.get("/search/:query", (req, res)=>{
    db.parse(db.code.search, req, res)
})

// api endpoint to store a newly created order object in the databas
app.post("/order", (req, res)=>{
    db.parse(db.code.order, req, res)
})

// api endpoint to update
app.put("/update", (req, res)=>{
    db.parse(db.code.update, req, res)
})

// middleware to handle any requests made that can't be fulfilled
app.use((req, res, next)=>{
    res.status(404).json({message: "Resource not found"})
})

console.log("[+] Server running on port:"+portNumber)
// have server listen on provided port
const httpServer = app.listen(portNumber)
// create socket using http server
const io = new Server(httpServer)

// callback when a client socket connects to the server socket
io.on("connect", (client)=>{
    console.log(`Client connected with id: [${client.id}]`)
    // when a search signal is emitted the following is performed
    client.on("search", async(searchTerm)=>{
        // searches the database for items with properties matching the provided search term
        let results = await db.parse(db.code.search, searchTerm, null)
        // when results are found the server emits a signal indicating that results are found and returns all of said results
        io.emit("found", results)
    })
})

// when the process is interrupted, therefore CTRL+C
process.on("SIGINT", async()=>{
    try{
        // terminates the databse connection if it exists
        await db.terminateConnection()
    }catch(err){
        console.log(err)
    }finally{
        // exits the process
        console.log("[!] Terminating database connection")
        process.exit()
    }
    
})