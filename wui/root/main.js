function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (message) {
        appendMessage(message, 'user');
        input.value = '';

        // FetchAPI for API responses
        setTimeout(() => {
            appendMessage('This is a bot response.', 'bot');
        }, 1e3);
    }
}


function appendMessage(message, type) {
    const chatMessages = document.getElementById('chatMessages');
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', type);
    bubble.textContent = message;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


document.querySelector('input').onkeyup = e => {
  if (e.key === "Enter") {
    sendMessage();
  }
}
