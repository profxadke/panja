#!/usr/bin/env python


from discord import Intents
from discord.ext import commands
import google.generativeai as gAI
from os import environ as env
from dotenv import load_dotenv


load_dotenv()
gAI.configure(api_key=env["KEY"])
description = '''A simple bot to talk with P4nj.A!

Either DM me, or use me on any #bot(s) channel with '> ' as prefix (yeah, a backquote)'''
intents = Intents.default()
intents.message_content = True
intents.members = True
chat = None
bot = commands.Bot(command_prefix='> ', description=description, intents=intents)


def split_string_by_chunk(string, chunk_length):
  """Splits a string into chunks of a given length.

  Args:
    string: The string to split.
    chunk_length: The desired length of each chunk.

  Returns:
    A list of string chunks.
  """
  return [string[i:i+chunk_length] for i in range(0, len(string), chunk_length)]


@bot.event
async def on_ready():
    global chat
    model = gAI.GenerativeModel('gemini-1.5-flash')
    chat = model.start_chat()
    print('-'*5)
    print(f'[+] Logged in as {bot.user} (ID: {bot.user.id}) And, Gemini-1.5-Flash PaLM LLM started!')
    print('-'*5)


@bot.event
async def on_message(msg):
    # TODO: individual user's context handling for chat with the model.
    if not msg.guild:
        # This is a DM
        if msg.author.bot:
            return
        async with msg.channel.typing():
            resp = chat.send_message(msg.content).text.strip()
            if len(resp) >= 1999:
                response = split_string_by_chunk(resp, 1999)
                await msg.reply(response[0], mention_author=False)
                for resp in response[1:]:
                    await msg.channel.send(resp)
            else:
                await msg.reply(resp, mention_author=False)
    if msg.content.startswith('> '):
        async with msg.channel.typing():
            resp = chat.send_message(msg.content[2:]).text.strip()
            if len(resp) >= 1999:
                response = split_string_by_chunk(resp, 1999)
                await msg.reply(response[0], mention_author=False)
                for resp in response[1:]:
                    await msg.channel.send(resp)
            else:
                await msg.reply(resp, mention_author=False)


if __name__ == '__main__':
    bot.run(env['TOKEN'])
