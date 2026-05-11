const bedrock = require('bedrock-protocol');
const express = require('express');

const HOST = 'newbedrock.mcsh.io';
const PORT = 19132;
const BOT_NAME = 'zé servizin';

const app = express();
app.get('/', (req, res) => res.send('Bot rodando! ✅'));
app.listen(3000, () => console.log('HTTP ativo na porta 3000'));

let client = null;
let connecting = false;

function desconectar() {
  if (client) {
    try { client.removeAllListeners(); client.close(); } catch(e) {}
    client = null;
  }
  connecting = false;
}

function conectarBot() {
  if (connecting) return;
  desconectar();
  connecting = true;

  console.log(`🤖 Conectando em ${HOST}:${PORT}...`);

  const timeout = setTimeout(() => {
    console.log('⏱️ Timeout! Tentando de novo...');
    desconectar();
    setTimeout(conectarBot, 30000);
  }, 15000);

  try {
    client = bedrock.createClient({
      host: HOST,
      port: PORT,
      username: BOT_NAME,
      offline: true,
      skipPing: true,
      version: '1.26.20'
    });
  } catch (e) {
    clearTimeout(timeout);
    desconectar();
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
    console.log('❌ Kickado:', JSON.stringify(reason));
    desconectar();
    setTimeout(conectarBot, 30000);
  });

  client.on('error', (err) => {
    clearTimeout(timeout);
    console.log('⚠️ Erro:', err.message);
    desconectar();
    setTimeout(conectarBot, 30000);
  });

  client.on('close', () => {
    clearTimeout(timeout);
    console.log('🔄 Reconectando em 30s...');
    desconectar();
    setTimeout(conectarBot, 30000);
  });
}

conectarBot();
setInterval(() => console.log('🔁 Ciclo ativo...'), 50 * 60 * 1000);
