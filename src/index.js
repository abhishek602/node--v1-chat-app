const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');


const app = express();
const server = http.createServer(app); // thats create a new server across the express.
const io = socketio(server); // socket setup


const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");


app.use(express.static(publicDirectoryPath)); // uses the static file in public dir.



io.on("connection", (socket) => {
  // func runs when connection stablish with client.
  console.log(" New websocket connection ");

  socket.on('join', (options,callback) => {
    
   const{ error, user} = addUser({ id: socket.id, ...options })

    if (error) {
       return callback(error)
    }
    
    socket.join(user.room);

    socket.emit("message", generateMessage('Admin','Welcome!'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`));
    
    io.to(user.room).emit('roomData', {
      room: user.room,
      users:getUsersInRoom(user.room),
    })

    callback();

  })
  

    socket.on("sendMessage", (msg, callback) => {
      
      const user = getUser(socket.id);
      const filter = new Filter() // initializing the bad-words
        

        if (filter.isProfane(msg)) {
            return callback('Dont use profanity(bad-words)!!')
        }


      io.to(user.room).emit("message", generateMessage(user.username,msg));
      callback();
  });
    

    socket.on('sendLocation', (coords,callback) => {
      const user = getUser(socket.id);

         io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`));

       callback()

    })
    

  socket.on('disconnect', () => {
     
    const user = removeUser(socket.id)
    
    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
      
      io.to(user.room).emit('roomData', {
        room: user.room,
        users:getUsersInRoom(user.room),
      })

    }  
    

    })
});

server.listen(port, () => {
  console.log("Server is up on port" + port);
});


