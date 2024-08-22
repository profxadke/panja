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
const splitMessage = (message, limit) => {
  const chunks = [];
  while (message.length > limit) {
    let chunk = message.slice(0, limit);
    // Ensure we don't split in the middle of a word
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
};


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
  const context = await model.generateContent(content);
  const response = await context.response;
  let resp = response.text().trim();

  resp = splitMessage(resp, MESSAGE_LIMIT );

  if (message.guild){
    await message.reply({content: resp[0], allowedMentions: { repliedUser: false } });
    if (resp.length - 1) {
      resp.slice(1).forEach( async r => {
        await message.channel.send({content: r });
      })
    }
  } else {
    resp.forEach( async r => {
      await message.author.send(r);
    })
  }


})


client.login(token);
