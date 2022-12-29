#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DATA=$(cat "$SCRIPT_DIR/../appdir.txt")
cd "$SCRIPT_DIR/../../$DATA"
IP="$( ifconfig | grep 192.168.1 | awk '{print $2}' )"
echo "Your IP Address is: $IP"
echo "debug:$IP" > ./www/mode.txt
read -n1 -r -p "Press any key to terminate..." key