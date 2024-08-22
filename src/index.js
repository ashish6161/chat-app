const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('../src/utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('../src/utils/users')

const app = express()

const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 8080
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

//let count = 0
let message = 'Welcome'

io.on('connection', (socket)=>{
    console.log('Web socket started')

    socket.on('join', ({username, room}, callback)=>{

        const {error, user} = addUser({id: socket.id, username, room})

        if(error){
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', message))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the chat room!`)) // socket.broadcast.emit() is used to broadcast message to all the client except current one
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    // socket.emit('countUpdated', count)

    socket.on('sendMessage', (message, callback)=>{
        const userDetails = getUser(socket.id)
                        
        io.to(userDetails.room).emit('message', generateMessage(userDetails.username, message))
        callback('Delivered!')
    })

    socket.on('sendLocation', (location, callback)=>{
        const userDetails = getUser(socket.id)
        
        io.to(userDetails.room).emit('locationShared', generateLocationMessage(userDetails.username, `https://google.com/maps?q=${location.Lat},${location.Long}`))
        callback('Thanks for sharing location')
    })

    // Socket.on('disconnect', call back function) is used for notifying when client has closed the browser 
   socket.on('disconnect', ()=>{
    const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left the room`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
   })
})

server.listen(port, ()=>{
    console.log('Server started using port ' + port)
})