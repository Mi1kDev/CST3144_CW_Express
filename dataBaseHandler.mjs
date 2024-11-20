import {MongoClient} from 'mongodb';
import { v4 as uuidv4} from 'uuid';

export default class DataBaseHandler{
    constructor(dbURL){
        this.dbURL = dbURL
        this.baseImageURI = "https://cst3144-cw-express.onrender.com"
        //this.baseImageURI = "http://localhost:5174"
        this.client = {
            isActive: null,
            instance: {
              mainDb: null,
              main: null
            }
        }
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
            }
        }
        this.code = {
            getLessons: 0, 
            search: 1,
            update: 2,
            order: 3
        }
        this.establishConnection()
    }
    // make a connetion to the database
    establishConnection = async() =>{
      try{
        this.client.instance.main = new MongoClient(this.dbURL)
        await this.client.instance.main.connect()
        await this.client.instance.main.db("ClubData").command({ping: 1})
        this.client.instance.mainDb = this.client.instance.main.db("ClubData")
        console.log("[!] Database connection established!")
        this.client.isActive = true
      }catch(err){
        this.client.isActive = false
        if(err){throw err}
      }
    }

    terminateConnection = async() =>{
      if(!this.client.isActive) return
      await this.client.instance.main.close()
      this.client.isActive = false
    }

    generateResultObj(success, message, obj){
      return {status: {value: success, message: message}, value: obj}
    }

    // get all lessons from the database
    getLessons = async() =>{
      let returnObj
      if(!this.client.isActive){
        returnObj = this.generateResultObj(false, this.statusMessages.inActive, null)
        return returnObj
      }
        // let lessons = [
        //     {
        //         name: "Mathematics",
        //         description: "Mathematics for beginners",
        //         location: "103 Address Street",
        //         cost: 10,
        //         availableSlots: 5,
        //         imageURL: this.baseURI+'/icons/Calculator.png',
        //       },
        //       {
        //         name: "English",
        //         description: "English for beginners",
        //         location: "123 Address Street",
        //         cost: 20,
        //         availableSlots: 5,
        //         imageURL: "",
        //       },
        //       {
        //         name: "Spanish",
        //         description: "Spanish for beginners",
        //         location: "123 Address Street",
        //         cost: 15,
        //         availableSlots: 5,
        //         imageURL: "",
        //       },
        //       {
        //         name: "Chemistry",
        //         description: "Chemistry for beginners",
        //         location: "123 Address Street",
        //         cost: 10,
        //         availableSlots: 5,
        //         imageURL: this.baseURI+"/icons/Chemistry.png",
        //       },
        //       {
        //         name: "Physics",
        //         description: "Physics for beginners",
        //         location: "123 Address Street",
        //         cost: 16,
        //         availableSlots: 5,
        //         imageURL: "",
        //       },
        //       {
        //         name: "Biology",
        //         description: "Biology for beginners",
        //         location: "123 Address Street",
        //         cost: 21,
        //         availableSlots: 5,
        //         imageURL: "",
        //       },
        //       {
        //         name: "Mechanical Engineering",
        //         description: "Mechanical Engineering for beginners",
        //         location: "123 Address Street",
        //         cost: 20,
        //         availableSlots: 5,
        //         imageURL: "",
        //       },
        //       {
        //         name: "IT",
        //         description: "IT for beginners",
        //         location: "123 Address Street",
        //         cost: 25,
        //         availableSlots: 5,
        //         imageURL: "",
        //       },
        //       {
        //         name: "Computer Science",
        //         description: "Computer Science for beginners",
        //         location: "123 Address Street",
        //         cost: 20,
        //         availableSlots: 5,
        //         imageURL: "",
        //       },
        //       {
        //         name: "French",
        //         description: "French for beginners",
        //         location: "123 Address Street",
        //         cost: 8,
        //         availableSlots: 5,
        //         imageURL: "",
        //       },
        // ]
      const cursor = this.client.instance.mainDb.collection("lessons").find()
      if(await this.client.instance.mainDb.collection("lessons").countDocuments() == 0){
        returnObj = this.generateResultObj(false, this.statusMessages.lessons.fail, null)
        return returnObj
      }
      let lessons = []
      for await(const doc of cursor){
        doc.imageURL = this.baseImageURI + doc.imageURL
        lessons.push(doc)
      }
      returnObj = this.generateResultObj(true, this.statusMessages.lessons.success, lessons)
      return returnObj
    }
    // filters lessons from the database by provided query
    search = async(searchTerm) =>{
        if(!this.client.isActive){
            return
        }
        let query = {$or: [
          {name:  {$regex: searchTerm, $options: "i"}}, 
          {location: {$regex: searchTerm, $options: "i"}},
          {description: {$regex: searchTerm, $options: "i"}},
          {location: {$regex: searchTerm, $options: "i"}},
          {availableSlotsStr: {$regex: searchTerm}},
          {costStr: {$regex: searchTerm}},
        ]}
        let lessons = []
        console.log("Search Term : "+searchTerm)
        let cursor = await this.client.instance.mainDb.collection("lessons").aggregate(
          [{
            $addFields: {costStr: {$toString: "$cost"}, availableSlotsStr: {$toString: "$availableSlots"}}
          },{$match: query}
        ])
        //const cursor = await this.client.instance.mainDb.collection("lessons").find(query)
        for await(let doc of cursor){
          lessons.push(doc)
        }
        return lessons
    }
    // update quantity of lessons in the database
    update = async(updateObjects) =>{
      try{
        for(let updateObj of updateObjects){
          let lessonId = updateObj.lessonId
          let property = updateObj.property
          let query = {lessonId: lessonId}
          let updateValues = {}
          updateValues[property.type] = property.value
          let newValues = { $set : updateValues}
          await this.client.instance.mainDb.collection("lesson").updateOne(query, updateValues)
          console.log("[+] Lesson ID: "+lessonId+" updated with values: "+updateValues)
        } 
      }catch(err){
        if(err){throw err}
      }
    }

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

    parse = async(code, req, res) =>{
      if(code == this.code.getLessons){
          let respObj = await this.getLessons()
          res.send(respObj)
      }else if(code == this.code.search){
          let lessons = await this.search(req)
          return lessons
      }else if(code == this.code.update){
        let resp = await this.update(req.body)
        res.send(resp)
      }else if(code == this.code.order){
        let resp = await this.addOrder(req.body)
        res.send(resp)
      }
    }
}