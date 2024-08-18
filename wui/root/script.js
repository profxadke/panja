function messageApp() {
  return {
      newMessage: '',
      messages: [],
      isTyping: false,
      fetchMessages() {
          // Mock data
          this.messages = [
              { id: 1, content: 'Hello! How can I assist you today?', user: 'bot' },
              { id: 2, content: 'Hello!', user: 'user' },
              { id: 3, content: 'Tell me a joke', user: 'user' },
              { id: 4, content: "Why don't scientists trust atoms? Because they make up everything!", user: 'bot' }
          ];
          this.renderMessages();
      },
      renderMessages() {
          const messagesBody = document.getElementById('messages-body');
          messagesBody.innerHTML = ''; // Clear existing messages

          // Render each message
          this.messages.forEach(msg => {
              const messageDiv = document.createElement('div');
              messageDiv.classList.add('message');
              if (msg.user === 'bot') {
                  messageDiv.classList.add('bot');
              } else if (msg.user === 'user') {
                  messageDiv.classList.add('user');
              }
              response = renderMD(msg.content).trim();
              messageDiv.innerHTML = response.replace(/\n/g, '<br />');
              messagesBody.appendChild(messageDiv);
          });

          // Render typing indicator if isTyping is true
          if (this.isTyping) {
              const typingIndicator = document.createElement('div');
              typingIndicator.classList.add('typing-indicator');
              typingIndicator.innerHTML = `
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
              `;
              messagesBody.appendChild(typingIndicator);
          }

          messagesBody.scrollTop = messagesBody.scrollHeight; // Auto-scroll to the latest message
      },
      sendMessage() {
          if (this.newMessage.trim() !== '') {
              // Add the new message to the mock data
              const newMsg = { id: this.messages.length + 1, content: this.newMessage, user: 'user' };
              this.messages.push(newMsg);
              this.renderMessages();

              // Clear the input
              this.newMessage = '';

              // Simulate bot typing
              this.isTyping = true;
              this.renderMessages();

              fetch('/chat', {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({message: newMsg.content.trim()})
              }).then( response => {
                    response.json().then( resp => {
                      this.isTyping = false;
                      const botResponse = { id: this.messages.length + 1, content: resp.resp, user: 'bot' };
                      this.messages.push(botResponse);
                      this.renderMessages();
                  })
                })


              /* Mock bot response with a delay
              setTimeout(() => {
                  this.isTyping = false;
                  const botResponse = { id: this.messages.length + 1, content: "This is a mock bot response.", user: 'bot' };
                  this.messages.push(botResponse);
                  this.renderMessages();
              }, 2000); // 2 seconds delay for typing simulation
              */
          }
      }
  }
}

document.querySelector('textarea').onkeyup = e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    document.querySelector('button').click()
  }
}

var marked = new marked.Marked(
  markedHighlight.markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);



const addCopyButton = () => {
  var snippets = document.getElementsByTagName('pre');
  var numberOfSnippets = snippets.length;
  for (var i = 0; i < numberOfSnippets; i++) {
    code = snippets[i].getElementsByTagName('code')[0].innerText;

    snippets[i].classList.add('hljs'); // append copy button to pre tag

    snippets[i].innerHTML = '<button class="hljs-copy">Copy</button>' + snippets[i].innerHTML; // append copy button

    snippets[i].getElementsByClassName('hljs-copy')[0].addEventListener("click", function () {
      this.innerText = 'Copying..';
      // if (!navigator.userAgent.toLowerCase().includes('safari')) {
      //   navigator.clipboard.writeText(code);
      // } else {
      //   prompt("Clipboard (Select: ⌘+a > Copy:⌘+c)", code);
      // }
      navigator.clipboard.writeText(code);
      this.innerText = 'Copied!';
      button = this;
      setTimeout(function () {
        button.innerText = 'Copy';
      }, 1000)
    });
  }
}


const renderMD = markdown => {
  return DOMPurify.sanitize( marked.parse( markdown ) );
}
