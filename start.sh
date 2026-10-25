#!/usr/bin/env bash
# Запуск веб-приложения компаньона «До рассвета»
export PATH=/Users/matveyutemisov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/matveyutemisov/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH
cd "$(dirname "$0")"
echo "🧟 Запуск компаньона «До рассвета»..."
echo "📱 Доступно по адресу: http://localhost:3000"
./node_modules/.bin/vite --host 0.0.0.0 --port 3000
