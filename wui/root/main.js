const renderMD = markdown => {
  return DOMPurify.sanitize( marked.parse( markdown ) );
}


async function getMessageResponse(message) {
  /*
  fetch('/chat', {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({message: message})
  }).then( response => { 
    response.json().then( json_resp => {
      return json_resp.resp
    })
  })
  */
  resp = await fetch('/chat', {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({message: message})
  }); resp = await resp.json()
  return resp.resp
}


async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (message) {
        appendMessage(message, 'user');
        input.value = '';

        // FetchAPI for API responses
        appendMessage('', 'bot');
        chats = document.querySelectorAll('.chat-bubble');
        chats[chats.length - 1].remove()
        const response = await getMessageResponse(message);
        appendMessage(renderMD(response), 'bot');
        /*
        setTimeout(() => {
            appendMessage('This is a bot response.', 'bot');
        }, 1e3);
        */

    }
}


function appendMessage(message, type) {
    const chatMessages = document.getElementById('chatMessages');
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', type);
    bubble.innerHTML = message;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


document.querySelector('input').onkeyup = e => {
  if (e.key === "Enter") {
    sendMessage();
  }
}
