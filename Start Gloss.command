#!/bin/zsh
cd "$(dirname "$0")" || exit 1
if curl --silent --fail http://localhost:8767/api/status >/dev/null 2>&1; then
  open http://localhost:8767
else
  (sleep 1; open http://localhost:8767) &
  python3 server.py --port 8767
fi
