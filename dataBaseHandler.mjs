export default class DataBaseHandler{
    constructor(dbURL){
        this.dbURL = dbURL
        this.client = {
            isActive: true,
            instance: null
        }
        this.statusMessages = {
            inActive: "Database connection could not be established"
        }
        this.code = {
            getLessons: 0, 
            search: 1,
        }
    }
    // make a connetion to the database
    establishConnection = () =>{

    }

    // get all lessons from the database
    getLessons = () =>{
        if(!this.client.isActive){
            return this.statusMessages.inActive
        }
        let lessons = [
            {
                name: "Mathematics",
                description: "Mathematics for beginners",
                location: "103 Address Street",
                cost: 10,
                availableSlots: 5,
                imageURL: '/icons/Calculator.png',
              },
              {
                name: "English",
                description: "English for beginners",
                location: "123 Address Street",
                cost: 20,
                availableSlots: 5,
                imageURL: "",
              },
              {
                name: "Spanish",
                description: "Spanish for beginners",
                location: "123 Address Street",
                cost: 15,
                availableSlots: 5,
                imageURL: "",
              },
              {
                name: "Chemistry",
                description: "Chemistry for beginners",
                location: "123 Address Street",
                cost: 10,
                availableSlots: 5,
                imageURL: "/icons/Chemistry.png",
              },
              {
                name: "Physics",
                description: "Physics for beginners",
                location: "123 Address Street",
                cost: 16,
                availableSlots: 5,
                imageURL: "",
              },
              {
                name: "Biology",
                description: "Biology for beginners",
                location: "123 Address Street",
                cost: 21,
                availableSlots: 5,
                imageURL: "",
              },
              {
                name: "Mechanical Engineering",
                description: "Mechanical Engineering for beginners",
                location: "123 Address Street",
                cost: 20,
                availableSlots: 5,
                imageURL: "",
              },
              {
                name: "IT",
                description: "IT for beginners",
                location: "123 Address Street",
                cost: 25,
                availableSlots: 5,
                imageURL: "",
              },
              {
                name: "Computer Science",
                description: "Computer Science for beginners",
                location: "123 Address Street",
                cost: 20,
                availableSlots: 5,
                imageURL: "",
              },
              {
                name: "French",
                description: "French for beginners",
                location: "123 Address Street",
                cost: 8,
                availableSlots: 5,
                imageURL: "",
              },
        ]
        return lessons
    }
    // filters lessons from the database by provided query
    search = (query) =>{
        if(!this.client.isActive){
            return
        }
    }

    parse = (code, req, res) =>{
        console.log(code)
        if(code == this.code.getLessons){
            console.log("[+] Returning lessons")
            res.send(this.getLessons())
        }else if(code == this.code.search){
            console.log("Wow I searched the query")
            res.send("Success")
        }else{

        }
    }
}