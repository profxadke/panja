const { Client, Events, Partials, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");


require('dotenv').config()
const MESSAGE_LIMIT = 1999;
const genAI = new GoogleGenerativeAI(process.env.KEY);
const token = process.env.TOKEN;
const client = new Client({ intents: [ GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers ], partials: [ Partials.Channel,
    Partials.Message ]
}); const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
const chat = model.startChat();
const splitMessage = (message, limit) => {
  const chunks = [];
  while (message.length > limit) {
    let chunk = message.slice(0, limit);
    const lastSpaceIndex = chunk.lastIndexOf(' ');
    if (lastSpaceIndex > -1) {
      chunk = chunk.slice(0, lastSpaceIndex);
    }
    chunks.push(chunk);
    message = message.slice(chunk.length).trim();
  }
  if (message.length > 0) {
    chunks.push(message);
  }
  return chunks;
}; let chatContext = '';


client.once(Events.ClientReady, bot => {
	console.log(`[+] Authenticated as ${bot.user.tag}!`);
}); const bot = client;


bot.on('messageCreate', async message => {
  if (message.author.bot) return;

  let content = message.content;
  
  if (content.startsWith('> ')) {
    content = content.slice(2);
  } else if ( message.content.includes(`<@${client.user.id}>`) ) {
    eval(`content = content.replace(/<@${bot.user.id}>/g, '');`);
  } else if ( !message.guild ) {
    // This is DM.
  } else {
    return;
  }

  await message.channel.sendTyping();
  const context = await chat.sendMessage(content);

  // TODO: Chat history sync.
  // TODO: Indivdual user's chat context, and history sync.
  if (!chatContext) {
    const firstPrompt = chat._history[0].parts[0].text;
    let contextPrompt = await model.generateContent(`Give me a short chat context to be set as chat title based on this as first prompt by the user: ${firstPrompt}`);
    chatContext = contextPrompt.response.text().trim();
  }

  let response = context.response.text().trim();

  response = splitMessage(response, MESSAGE_LIMIT );

  if (message.guild){
    await message.reply({content: response[0], allowedMentions: { repliedUser: false } });
    if (response.length - 1) {
      response.slice(1).forEach( async resp => {
        await message.channel.send({content: resp });
      })
    }
  } else {
    response.forEach( async resp => {
      await message.author.send(resp);
    })
  }


})


client.login(token);
