const bedrock = require('bedrock-protocol');
const express = require('express');

const HOST = '191.96.231.40';
const PORT = 13585;
const BOT_NAME = 'MeuBot';

const app = express();
app.get('/', (req, res) => res.send('Bot está rodando! ✅'));
app.listen(3000, () => console.log('Servidor HTTP ativo na porta 3000'));

function conectarBot() {
  console.log(`🤖 Tentando conectar em ${HOST}:${PORT}...`);

  let client;
  try {
    client = bedrock.createClient({
      host: HOST,
      port: PORT,
      username: BOT_NAME,
      offline: true,
      skipPing: true
    });
  } catch (e) {
    console.log('❌ Erro ao criar cliente:', e.message);
    setTimeout(conectarBot, 60000);
    return;
  }

  client.on('spawn', () => {
    console.log('✅ Bot entrou no servidor!');
  });

  client.on('kick', (reason) => {
    console.log('❌ Kickado:', JSON.stringify(reason));
    setTimeout(conectarBot, 30000);
  });

  client.on('error', (err) => {
    console.log('⚠️ Erro:', err.message);
  });

  client.on('close', () => {
    console.log('🔄 Reconectando em 1 minuto...');
    setTimeout(conectarBot, 60 * 1000);
  });
}

conectarBot();

setInterval(() => {
  console.log('🔁 Ciclo ativo...');
}, 50 * 60 * 1000);
