#!/bin/bash

if [[ ! -d .venv/ ]]; then
  uv venv
fi

source .venv/bin/activate
if [[ $1 == "bot" ]]; then
  cd bot/discord
  python main.py
elif [[ $1 == "web" ]]; then
  cd wui
  python main.py
else
  cd tui
  python main.py
fi
deactivate
