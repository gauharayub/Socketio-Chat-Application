const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
//message-form button for sending messages....
const $messageFormButton = $messageForm.querySelector('button')
//location button....
const $locationButton = document.querySelector('#location')
//voice recording button......
const $voiceButton = document.querySelector('#voice')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

//initializing voice-recognition API.....
try {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
}
catch(e){
    alert('Your browser does not support speech recognition consider using text only.')
}

//event handlers for recognition instance....
recognition.onstart = () => { 
    alert('Voice recognition activated. Try speaking into the microphone.')
}
  
recognition.onspeechend = () => {
    alert('You were quiet for a while so voice recognition turned itself off.')
}
  
recognition.onerror = (event) => {
    if(event.error == 'no-speech'){
      alert('No speech was detected. Try again.') 
    }
}

//onresult event handler provides us access to the transcripted speech.....
recognition.onresult = (event) => {

    //event is a SpeechRecognitionEvent object.
    //It holds all the lines we have captured so far. 
    //We only need the current one.
    var current = event.resultIndex
  
    //Get a transcript of what was said.
    var transcript = event.results[current][0].transcript
  
    
   
    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript)

    //code for handling mobile-related ( specifically android ) bugs...
    if(!mobileRepeatBug){
        //Add the current transcript to our input field....
        $messageFormInput.value = $messageFormInput.value + transcript
    }
}

const autoscroll = ()=>{
    //new message element
    const $newMessage = $messages.lastElementChild

    //height of the new message
    const newMessageStyles  = getComputedStyle($newMessage)
    const messageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + messageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //container Height --- Total height we can scroll through......
    const containerHeight = $messages.scrollHeight

    //how far scrolled currently from top
    const scrollOffset = $messages.scrollTop + visibleHeight

    //check if user is currently reading new message(user is at bottom of container)....
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    //Mustache render compliles template adding variable data 
    const html = Mustache.render(messageTemplate,
        //passing data object to insert data in html template using Mustache library.
        {
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(data)=>{
    const html = Mustache.render(locationMessageTemplate,{
        username:data.username,
        url:data.url,
        createdAt: moment(data.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})
socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

//event handler for sending message....
$messageForm.addEventListener('submit',(e)=>{
    //prevent full page refresh after submit event...
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    //alternative way of selecting input field..
    const message = e.target.elements.message.value

    //The third argument will be handler function for event acknowledgement....
    socket.emit('sendMessage',message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        //set the focus back on the input element...
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message Delivered!')
    })
})

//event handler for sending location.....
$locationButton.addEventListener('click',()=>{
        $locationButton.setAttribute('disabled','disabled')
    if(!navigator.geolocation){
        return alert('geolocation not supported for your browser')
    }
    //getCurrentPosition is an async function but it does nto support promises or async/await..
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            $locationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

//voice-to-text implementation.....
$voiceButton.addEventListener('click',()=>{
    recognition.start()
})

//add third argument as event acknowledgement..
socket.emit('join',{username,room},(error)=>{
    if (error){ 
        alert('Enter valid credentials to login')
        location.href = '/'
    }
    else{
        console.log('joined successfully')
    }
})