const socket = io()

const messageForm = document.querySelector('#form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('#relay')
const sendLocation = document.querySelector('#send-location')
const messages = document.querySelector('#messages')
//const locations = document.querySelector('#locations')

// Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//location.search shows query string QS library then parse it and turn it into an object
//ignoreQueryPrefix : true will ignore the '?' in query string
// destructure and store properties in the variable 
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix : true})

socket.on('message', (message)=>{
    
    const texthtml = Mustache.render(messageTemplate, {
        username: message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', texthtml)
})

socket.on('locationShared', (locationMessage)=>{
    const locationHtml = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        url : locationMessage.url,
        createdAt : moment(locationMessage.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', locationHtml)
    console.log(locationMessage)
})


messageForm.addEventListener('submit', (e)=>{
    //console.log(message.value)
    e.preventDefault()
    messageFormButton.setAttribute('disabled', 'disabled')

    //const message = document.querySelector('#input').value // same can be written in below format using target.elements if input type uses a name
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (message)=>{
        messageFormButton.removeAttribute('disabled')
        messageFormInput.value = ""
        messageFormInput.focus()

        console.log('Message delivered! ', message)
    })
})

socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})
sendLocation.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Geolocation not supported by your browser')
    }
    // Disbale button
    sendLocation.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',  {Lat : position.coords.latitude, Long : position.coords.longitude}, (message)=>{

            // Enable button after sending the location
            sendLocation.removeAttribute('disabled')
            console.log('Location shared')
            
        })
        //console.log(position.coords.latitude)
    })
})

socket.emit('join', ({username, room}), (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})