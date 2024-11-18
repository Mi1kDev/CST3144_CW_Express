import {MongoClient} from 'mongodb';
import { v4 as uuidv4} from 'uuid';

export default class DataBaseHandler{
    constructor(dbURL){
        this.dbURL = dbURL
        this.baseImageURI = "https://cst3144-cw-express.onrender.com"
        this.client = {
            isActive: true,
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
    }

    // get all lessons from the database
    getLessons = async() =>{
        if(!this.client.isActive){
            return []
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
          return []
        }
        let lessons = []
        for await(const doc of cursor){
          doc.imageURL = this.baseImageURI + doc.imageURL
          lessons.push(doc)
        }
        return lessons
    }
    // filters lessons from the database by provided query
    search = (query) =>{
        if(!this.client.isActive){
            return
        }
    }
    // update quantity of lessons in the database
    update = (lessonId, newQty) =>{

    }

    addOrder = async(order) =>{
      try{
        let orderId = uuidv4()
        let newOrder = {
          orderId: orderId,
          user: order
        }
        console.log("[+] Adding order with id: "+orderId)
        await this.client.instance.mainDb.collection("orders").insertOne(newOrder)
        return this.statusMessages.order.success
      }catch(err){
        if(err){throw err}
        return this.statusMessages.order.fail
      }
    }

    parse = async(code, req, res) =>{
        if(code == this.code.getLessons){
            let lessons = await this.getLessons()
            res.send(lessons)
        }else if(code == this.code.search){
            console.log("Wow I searched the query")
            res.send("Success")
        }else if(code == this.code.update){
          console.log("Update value in database")
        }else if(code == this.code.order){
          let resp = await this.addOrder(req.body)
          res.send(resp)
        }
    }
}