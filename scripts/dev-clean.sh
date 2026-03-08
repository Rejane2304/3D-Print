#!/bin/bash
# Script para liberar el puerto 3000 antes de iniciar Next.js
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
yarn dev
