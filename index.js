const bedrock = require('bedrock-protocol');
const express = require('express');

const HOST = '191.96.231.40';
const PORT = 13585;
const BOT_NAME = 'MeuBot';

const app = express();
app.get('/', (req, res) => res.send('Bot rodando! ✅'));
app.listen(3000, () => console.log('HTTP ativo na porta 3000'));

function conectarBot() {
  console.log(`🤖 Conectando em ${HOST}:${PORT}...`);

  let client;

  // Timeout de 15 segundos caso não responda
  const timeout = setTimeout(() => {
    console.log('⏱️ Timeout! Servidor não respondeu. Tentando de novo...');
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
      connectTimeout: 10000
    });
  } catch (e) {
    clearTimeout(timeout);
    console.log('❌ Erro ao criar cliente:', e.message);
    setTimeout(conectarBot, 30000);
    return;
  }

  client.on('spawn', () => {
    clearTimeout(timeout);
    console.log('✅ Bot entrou no servidor!');
    setInterval(() => console.log('🟢 Bot ainda online...'), 60000);
  });

  client.on('kick', (reason) => {
    clearTimeout(timeout);
    console.log('❌ Kickado:', JSON.stringify(reason));
    setTimeout(conectarBot, 30000);
  });

  client.on('error', (err) => {
    clearTimeout(timeout);
    console.log('⚠️ Erro:', err.message);
    setTimeout(conectarBot, 30000);
  });

  client.on('close', () => {
    clearTimeout(timeout);
    console.log('🔄 Desconectado. Reconectando em 30s...');
    setTimeout(conectarBot, 30000);
  });
}

conectarBot();

setInterval(() => {
  console.log('🔁 Ciclo ativo...');
}, 50 * 60 * 1000);
