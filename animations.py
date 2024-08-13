from sys import stdout
from time import sleep
from random import uniform
from threading import Event, Thread


def teletype(response, animate='c'):
    try:
        if animate == 'c':
            for char in response:
                print(char, end='', flush=True)
                sleep(uniform(0.01, 0.02))
        elif animate == 'l':
            resp = response.split(' ')
            for itr in range(len(resp)):
                word = resp[itr]
                if itr + 1 == len(resp):
                    print(word, end='', flush=True)
                else:
                    print(word, end=' ', flush=True)
                sleep(uniform(0.01, 0.02))
        else:
            print(response)
    except KeyboardInterrupt:
        print()
        exit(0)


class Spinner:
    def __init__(self, message="Loading... ", delay=0.05):
        self.spinner_cycle = ['|', '/', '-', '\\']
        self.delay = delay
        self.message = message
        self.stop_running = Event()

    def spinner_task(self):
        while not self.stop_running.is_set():
            for symbol in self.spinner_cycle:
                stdout.write(f'\r{self.message}{symbol}')
                stdout.flush()
                sleep(self.delay)

    def start(self):
        self.stop_running.clear()
        self.thread = Thread(target=self.spinner_task)
        self.thread.start()

    def stop(self):
        self.stop_running.set()
        self.thread.join()
        stdout.write('\r' + ' ' * (len(self.message) + 1) + '\r')  # Clear the line
