//firestore databse instance for Chat App project
const db = require('../../db/firestore')

const addUser = async ({id,username,room})=>{
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //validate the data...
    if(!username || !room){
        return {
            error:"username and room are required"
        }
    }
    //referencing the collection....
    const users = db.collection('users')
    //check for existing user..
    let existingUser = await users.where('username','==',username).where('room','==',room).get()
    //validate username
    if(existingUser.size){
        return {
            error:"Username is in use!"
        }
    }
    const user = {username,room}
    users.doc(id).set(user)
    return {user}
}

const removeUser = async (id)=>{
    //referencing the collection....
    const users = db.collection('users')
    const user = await users.doc(id).get()
    if(!user){
        return undefined
    }
    await users.doc(id).delete()
    return user.data()
}

const getUser= async (id)=>{
    //referencing the collection....
    const users = db.collection('users')
    const user = await users.doc(id).get()
    return user.data()
}

const getUsersInRoom = async(room)=>{
    const users = db.collection('users')
    let usersInRoom = await users.where('room','==',room).get()
    usersInRoom = usersInRoom.docs.map((user)=>{
        return user.data()
    })
    return usersInRoom
}


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}