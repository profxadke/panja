// hljs.addPlugin(new CopyButtonPlugin());

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
        addCopyButton();
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
