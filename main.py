#!/usr/bin/env python

import readline
import google.generativeai as gai
from os import environ as env
from dotenv import load_dotenv
from mdv import main as render
from random import uniform
from time import sleep
from animations import teletype, Spinner


load_dotenv()
gai.configure(api_key=env["KEY"])


def main():
    model = gai.GenerativeModel('gemini-1.5-flash')
    chat = model.start_chat()

    while 1:
        try:
            prompt = input("\x1b[1mYou\x1b[0m: ")
            while not prompt:
                prompt = input("\n\x1b[1mYou\x1b[0m: ")
        except KeyboardInterrupt:
            prompt = 'die'
        except EOFError:
            prompt = 'quit'
        if prompt.lower() in ('bye', 'exit', 'quit', ':q', 'die'):
            print("exit\ngAI: Bye! Have a great day.")
            exit(0)
        try:
            spinner = Spinner("\x1b[1m\x1b[4mThinking\x1b[0m.. ", 0.04)
            spinner.start()
            resp = chat.send_message(prompt)
            spinner.stop()
        except Exception as e:
            print(f"ERROR: {e}")
            exit(1)
        resp_txt = render(resp.text).strip()
        print("\x1b[4m\x1b[1mgAI\x1b[0m:", end=" ", flush=True)
        teletype(''.join(resp_txt.split('  ')) + '\n'*2, 'l')


if __name__ == '__main__':
    main()
