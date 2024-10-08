#!/usr/bin/env python

import readline
import google.generativeai as gai
from os import environ as env
from dotenv import load_dotenv
from mdv import main as render
from animations import teletype, Spinner


load_dotenv()
gai.configure(api_key=env["KEY"])


def main():
    model = gai.GenerativeModel('gemini-1.5-flash')
    chat = model.start_chat()

    while 1:
        try:
            print("\x1b[1mYou\x1b[0m", end='', flush=True)
            prompt = input(": ")
            while not prompt:
                print("\x1b[1mYou\x1b[0m", end='', flush=True)
                prompt = input(": ")
            readline.add_history(prompt)
        except KeyboardInterrupt:
            prompt = 'die'
            print('exit')
        except EOFError:
            prompt = 'quit'
            print('exit')
        if prompt.lower() in ('bye', 'exit', 'quit', ':q', 'die'):
            print("\x1b[1m\x1b[4mgAI\x1b[0m: Bye! Have a great day.")
            exit(0)
        try:
            spinner = Spinner("\x1b[4m\x1b[1mgAI\x1b[0m: \x1b[1mThinking\x1b[0m.. ", 0.04)
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
