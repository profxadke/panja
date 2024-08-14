const renderMD = markdown => {
  return DOMPurify.sanitize( marked.parse( markdown ) );
}


async function getMessageResponse(message) {
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
        appendMessage(' ', 'bot');
        chats = document.querySelectorAll('.chat-bubble');
        thinkingAnimation = chats[chats.length - 1];
        thinkingAnimation.classList.add('thinking');
        const response = await getMessageResponse(message);
        thinkingAnimation.remove()
        appendMessage(renderMD(response), 'bot');

    }
}


const appendMessage = (message, type) => {
    const chatMessages = document.getElementById('chatMessages');
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', type);
    bubble.innerHTML = message.trim().replace(/\n/g, '<br />');
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


document.querySelector('textarea').onkeyup = e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}
