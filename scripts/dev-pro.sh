#!/bin/bash
# Script profesional para liberar el puerto 3000 y arrancar Next.js
PORT=3000
PROC=$(lsof -i :$PORT | grep LISTEN | awk '{print $2}')
if [ ! -z "$PROC" ]; then
  echo "Cerrando proceso en puerto $PORT (PID: $PROC)..."
  kill -9 $PROC
else
  echo "Puerto $PORT libre."
fi

# Arrancar Next.js
exec yarn dev
