const socket = io(); // this connect client to server //also takes all the data from server for client side js

//Element
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector('#messages');


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });


const autoscroll = () => {
   
  //New message element
  const $newMesaage = $messages.lastElementChild
 
  // Height of the new message
  const $newMesaageStyles = getComputedStyle($newMesaage);
  const $newMesaageMargin = parseInt($newMesaageStyles.marginBottom);
  const $newMesaageHeight = $newMesaage.offsetHeight + $newMesaageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // height of message container
  const containerHeight = $messages.scrollHeight

  //How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if (containerHeight - $newMesaageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }

}



socket.on("message", (msg) => {

  console.log(msg);
  const html = Mustache.render(messageTemplate, {
    username:msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format('h:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', html);

  autoscroll();
});

socket.on('locationMessage', (message) => {
  
  const html = Mustache.render(locationTemplate, {
    username:message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a')
  });
  
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html

})



$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  //disable button
  $messageFormButton.setAttribute("disabled", "disabled");

  const mesaage = e.target.elements.message.value;
  // console.log(mesaage);
  socket.emit("sendMessage", mesaage, (error) => {
    //enable button
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("Message delivered");
  });
});



$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported in your browser!");
  }
  //disable
  $locationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        //enable
        $locationButton.removeAttribute('disabled');
        console.log("Location send");
      }
    );
  });
 
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href ='/'
  }
});