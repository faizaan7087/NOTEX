#!/bin/bash
# Start Agent Arex (backend live agent + frontend) from NOTEX root
cd "$(dirname "$0")/Arex" || exit 1
./start_app.sh

