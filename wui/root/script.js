function messageApp() {
  return {
      newMessage: '',
      chat_id: 0,
      conversations: [
        { id: 1, name: 'Conversation 1' },
        { id: 2, name: 'Conversation 2' },
        { id: 3, name: 'Conversation 3' },
      ],
      messages: [],
      isTyping: false,
      fetchMessages() {

          fetch(`/history/${this.chat_id}`, {headers: {"Authorization": `Bearer ${localStorage.getItem('token')}`}}).then( response => {
            response.json().then( resp => {
              this.messages = resp.resp;
              if (!this.chat_id) {
                this.chat_id = this.messages[0].chat_id;
              }
              this.renderMessages();
            })
          })

      },
      renderMessages() {
          const messagesBody = document.getElementById('messages-body');
          messagesBody.innerHTML = '';

          // Render each message
          this.messages.forEach(msg => {
              console.log(msg);
              const messageDiv = document.createElement('div');
              messageDiv.classList.add('message');
              // console.log(msg)
              if (msg.role === 'model') {
                  messageDiv.classList.add('bot');
              } else if (msg.role === 'user') {
                  messageDiv.classList.add('user');
              }
              response = renderMD(msg.message).trim();
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
              // console.log(this.newMessage);
              const newMsg = { id: this.messages.length + 1, message: this.newMessage, role: 'user' };
              this.messages.push(newMsg);
              this.renderMessages();

              // Clear the input
              this.newMessage = '';

              // Simulate bot typing
              this.isTyping = true;
              this.renderMessages();

              const timer = Date.now();

              fetch(`/chat/${this.chat_id}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({message: newMsg.message})
              }).then( response => {
                    response.json().then( resp => {
                      this.isTyping = false;
                      this.chat_id = resp.chat;
                      const took = ( Date.now() - timer ) / 1e3;
                      const botResponse = { id: this.messages.length + 1, message: resp.resp + `<hr /><i>Took: ${took}s</i >`, role: 'model' };
                      console.log(botResponse);
                      this.messages.push(botResponse);
                      this.renderMessages();
                  })
                })

          }
      },
      switchConversation(index) {
        this.chat_id = index;
        this.fetchMessages();
      }
  }
}

document.querySelector('textarea').onkeyup = e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    element = document.querySelector('textarea');
    element.focus();
    element.setSelectionRange(element.value.length,element.value.length);
    document.querySelector('button').click()
  }
}

document.addEventListener('keydown', e => {
  if ( e.key === "Tab" ) {
    e.preventDefault();
    document.querySelector('textarea').focus();
  }
})

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


if (!localStorage.getItem('token')) {
  document.location = '/auth.html';  // TODO: Check token expiration too.
}
