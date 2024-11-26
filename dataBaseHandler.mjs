import {MongoClient} from 'mongodb';
import { v4 as uuidv4} from 'uuid';

// class to manage and control interactions between the server and database
export default class DataBaseHandler{
    constructor(dbURL){
        this.dbURL = dbURL
        // base url for the render.com instance, this is prepended to any static urls
        this.baseImageURI = "https://cst3144-cw-express.onrender.com"
        // stores the state of the database connection as well as instances of the main database and cluster
        this.client = {
            isActive: null,
            instance: {
              mainDb: null,
              main: null
            }
        }
        // stores status messages that should be returned under certain conditions
        this.statusMessages = {
            inActive: "Database connection could not be established",
            order: {
              success: "Order stored successfully",
              fail: "Order could not be stored"
            },
            found: {
              success: "Document located",
              fail: "Document not located"
            },
            lessons: {
              success: "Returned all lessons",
              fail: "Lessons could not be found"
            },
            update: {
              success: "Updated values in database",
              fail: "Failed to update values"
            },
            search: {
              success: "Items found",
              fail: "Something went wrong searching for item"
            }
        }
        // stores codes representing various possible operations
        this.code = {
            getLessons: 0, 
            search: 1,
            update: 2,
            order: 3
        }
        // attempts to create a connection to the database
        this.establishConnection()
    }
    // make a connetion to the database
    establishConnection = async() =>{
      try{
        // creates an instance of a MongoClient using provided database url
        this.client.instance.main = new MongoClient(this.dbURL)
        // attempts to connect to the database
        await this.client.instance.main.connect()
        // check that the database is up
        await this.client.instance.main.db("ClubData").command({ping: 1})
        this.client.instance.mainDb = this.client.instance.main.db("ClubData")
        console.log("[!] Database connection established!")
        // if the database is active then this is reflected with the state of the client variable
        this.client.isActive = true
      }catch(err){
        // if the database is not active then this is reflected with the state of the client variable
        this.client.isActive = false
        if(err){throw err}
      }
    }

    // terminates connection to the database if the database had been connected before
    terminateConnection = async() =>{
      if(!this.client.isActive) return
      await this.client.instance.main.close()
      this.client.isActive = false
    }

    // generates a uniform object to send back the status of the the request, an appropriate message as well as any necessary return data 
    generateResultObj(success, message, obj){
      return {status: {value: success, message: message}, value: obj}
    }

    // returns all lessons in the database
    getLessons = async() =>{
      let returnObj
      // checks that the database is active. If it is not then it returns an object detailing the error
      if(!this.client.isActive){
        returnObj = this.generateResultObj(false, this.statusMessages.inActive, null)
        return returnObj
      }
      // finds all lessons in the lessons collection of the database
      const cursor = this.client.instance.mainDb.collection("lessons").find()
      // returns an error message if no documents are located
      if(await this.client.instance.mainDb.collection("lessons").countDocuments() == 0){
        returnObj = this.generateResultObj(false, this.statusMessages.lessons.fail, null)
        return returnObj
      }
      let lessons = []
      // stores all located documents in a list
      for await(const doc of cursor){
        // prepends the render.com url to the image url stored in the database
        doc.imageURL = this.baseImageURI + doc.imageURL
        lessons.push(doc)
      }
      returnObj = this.generateResultObj(true, this.statusMessages.lessons.success, lessons)
      return returnObj
    }

    // filters lessons from the database by provided search term
    search = async(searchTerm) =>{
      let returnObj
        if(!this.client.isActive){
            returnObj = this.generateResultObj(false, this.statusMessages.inActive, [])
        }
      try {
        let lessons = []
        
        if (searchTerm === "") {
          const cursorPtr = this.client.instance.mainDb.collection("lessons").find()
          for await (let doc of cursorPtr) {
            doc.imageURL = this.baseImageURI + doc.imageURL
            lessons.push(doc)
          }
          returnObj = this.generateResultObj(true, this.statusMessages.search.success, lessons)
          return returnObj
        }
        let query = {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { location: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
            { location: { $regex: searchTerm, $options: "i" } },
            { availableSlotsStr: { $regex: searchTerm } },
            { costStr: { $regex: searchTerm } },
          ]
        }
        const cursor = await this.client.instance.mainDb.collection("lessons").aggregate(
          [{
            $addFields: { costStr: { $toString: "$cost" }, availableSlotsStr: { $toString: "$availableSlots" } }
          }, { $match: query }
          ])
        for await (let doc of cursor) {
          doc.imageURL = this.baseImageURI + doc.imageURL
          lessons.push(doc)
        }
        returnObj = this.generateResultObj(true, this.statusMessages.search.success, lessons)
        return returnObj
      } catch (err) {
        console.log("[!] Error: ",err)
        returnObj = this.generateResultObj(false, this.statusMessages.search.fail, [])
        
      }
        
    }

    // update property of a lesson object in the database
    update = async(updateObjects) =>{
      let resObj
      try{
        for(let updateObj of updateObjects){
          let lessonId = updateObj.lessonId
          let property = updateObj.property
          let query = {lessonId: lessonId}
          let updateValues = {}
          updateValues[property.type] = property.value
          let newValues = { $set : updateValues}
          const result = await this.client.instance.mainDb.collection("lessons").updateOne(query, newValues)
          console.log("[+] Lesson ID: "+lessonId+" updated with values:",updateValues)
          resObj = this.generateResultObj(true, this.statusMessages.update.success, null)
          return resObj
        } 
      }catch(err){
        if(err){throw err}
        resObj = this.generateResultObj(false, this.statusMessages.update.fail, null)
        return resObj
      }
    }

    // adds a new order to the databse collection
    addOrder = async(order) =>{
      let returnObj
      try{
        let orderId = uuidv4()
        let newOrder = {
          orderId: orderId,
          user: order
        }
        console.log("[+] Adding order with id: "+orderId)
        await this.client.instance.mainDb.collection("orders").insertOne(newOrder)
        returnObj = this.generateResultObj(true, this.statusMessages.order.success, null)
        return returnObj
      }catch(err){
        if(err){throw err}
        returnObj = this.generateResultObj(false, this.statusMessages.order.fail, null)
        return returnObj
      }
    }

    // parses operations for the database handler to perform by matching the provided code to the intended operation
    parse = async(code, req, res) =>{
      if(code == this.code.getLessons){
          let respObj = await this.getLessons()
          res.send(respObj)
      }else if(code == this.code.search){
          let lessons = await this.search(req.params.query)
          res.send(lessons)
      }else if(code == this.code.update){
        let resp = await this.update(req.body)
        res.send(resp)
      }else if(code == this.code.order){
        let resp = await this.addOrder(req.body)
        res.send(resp)
      }
    }
}