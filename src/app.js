const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()

//create server explicitly to make it passable to socketio function...
const server  = http.createServer(app)
const port = process.env.PORT || 3000

//using socketio to make the server support web sockets protocol.....
const io = socketio(server)

//parse json to object for easier use in js
app.use(express.json())
//used to customize the server for serving files from static directory............
//if public dir. have an html file then it will be served ahead of any route having empty or '/' as url string......
app.use(express.static(path.join(__dirname,'../public')))

//setting up event-handler for socketio server for the event of connection.....
io.on('connection',(socket)=>{
    console.log('New Web Socket Connection')
    socket.on('join',async ({username,room},callback)=>{
        const {error,user} = await addUser({id:socket.id,username,room})
        if(error){
            //call the aknowledgement function with error as parameter....
            return callback(error)
        }
        //socket.join() gives us access to methods for joining a specific room...
        socket.join(user.room)
        const allUsers = await getUsersInRoom(user.room)
        socket.emit('message',generateMessage('admin','Welcome to room'))
        //broadcast event to all except this socket in the current room.....
        //to method will not work without a join call above it..
        socket.broadcast.to(user.room).emit('message',generateMessage('admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:allUsers
        })
        callback()
        
    })

    socket.on('sendMessage',async (message,callback)=>{
            const user = await getUser(socket.id)

            const filter = new Filter()
            //is profane checks for bad-words in the string...
            if(filter.isProfane(message)){
                return callback('Profanity is not allowed..')
            }
            io.to(user.room).emit('message',generateMessage(user.username,message))
            callback()
    })
    socket.on('sendLocation',async (data,callback)=>{
        const user  = await getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,data))
        //call callback for event acknowledgement...
        callback()
    })
//event handler for user leaving the chat room.....
    socket.on('disconnect',async ()=>{
       const user =  await removeUser(socket.id)
       if(user){
            io.to(user.room).emit('message',generateMessage('admin',`${user.username} has left the chatroom`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:await getUsersInRoom(user.room)
            })
       }
    })
})


server.listen(port,()=>{
    console.log(`Server is up on port ${port}!`)
})