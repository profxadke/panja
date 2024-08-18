#!/bin/bash

let $env_path = ".venv"
if ($env_path | path exists) {
  '[+] Virtual environment found, activing it.'
  overlay use .venv\Scripts\activate.nu
} else {
  uv venv
  overlay use .venv\Scripts\activate.nu
}

def main [mode: string] {
  print $mode
  if $mode == "bot" {
    cd bot/discord
    python main.py
  } else if $mode == "web" {
    cd wui
    python main.py
  } else {
    cd tui
    python main.py
  }
}
deactivate

main $1
