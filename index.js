const bedrock = require('bedrock-protocol');
const express = require('express');

const HOST = 'newbedrock.mcsh.io';
const PORT = 19132;
const BOT_NAME = 'zé servizin';

const app = express();
app.get('/', (req, res) => res.send('Bot rodando! ✅'));
app.listen(3000, () => console.log('HTTP ativo na porta 3000'));

let connecting = false;

function conectarBot() {
  if (connecting) return;
  connecting = true;

  console.log(`🤖 Conectando em ${HOST}:${PORT}...`);

  let client;

  const timeout = setTimeout(() => {
    console.log('⏱️ Timeout! Tentando de novo...');
    connecting = false;
    try { client.close(); } catch(e) {}
    setTimeout(conectarBot, 30000);
  }, 15000);

  try {
    client = bedrock.createClient({
      host: HOST,
      port: PORT,
      username: BOT_NAME,
      offline: true,
      skipPing: true,
      version: '1.26.10'
    });
  } catch (e) {
    clearTimeout(timeout);
    connecting = false;
    console.log('❌ Erro:', e.message);
    setTimeout(conectarBot, 30000);
    return;
  }

  client.on('spawn', () => {
    clearTimeout(timeout);
    connecting = false;
    console.log('✅ Bot entrou no servidor!');
    setInterval(() => console.log('🟢 Bot online...'), 60000);
  });

  client.on('kick', (reason) => {
    clearTimeout(timeout);
    connecting = false;
    console.log('❌ Kickado:', JSON.stringify(reason));
    setTimeout(conectarBot, 30000);
  });

  client.on('error', (err) => {
    clearTimeout(timeout);
    connecting = false;
    console.log('⚠️ Erro:', err.message);
    setTimeout(conectarBot, 30000);
  });

  client.on('close', () => {
    clearTimeout(timeout);
    connecting = false;
    console.log('🔄 Reconectando em 30s...');
    setTimeout(conectarBot, 30000);
  });
}

conectarBot();
setInterval(() => console.log('🔁 Ciclo ativo...'), 50 * 60 * 1000);
