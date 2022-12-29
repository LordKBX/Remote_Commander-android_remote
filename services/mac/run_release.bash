#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DATA=$(cat "$SCRIPT_DIR/appdir.txt")
cd "$SCRIPT_DIR/../../$DATA"
echo "release" > ./www/mode.txt
node "../../services/livews.js" &
cordova prepare ios
cordova emulate ios
read -n1 -r -p "Press any key to terminate..." key