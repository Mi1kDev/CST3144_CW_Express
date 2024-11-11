import express from 'express'
import bodyParser from 'body-parser'
import DataBaseHandler from './dataBaseHandler.mjs'

const app = express()
const db = new DataBaseHandler("test")
const portNumber = 5174

app.use(bodyParser.json())
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

app.get("/api/lessons", (req, res)=>{
    db.parse(db.code.getLessons, req, res)
})

app.post("/api/search", (req, res)=>{
    db.parse(db.code.search, req, res)
})

console.log("[+] Server running at localhost:"+portNumber)
app.listen(portNumber)