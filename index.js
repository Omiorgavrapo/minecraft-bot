const bedrock = require('bedrock-protocol');
const express = require('express');

// =============================
// CONFIGURE AQUI ⬇️
const HOST = 'newbedrock.enderman.cloud'; // endereço do seu servidor
const PORT = 27225;                        // porta do servidor (padrão bedrock)
const BOT_NAME = 'MeuBot';               // nome do bot
// =============================

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
      offline: true // não precisa de conta Microsoft
    });
  } catch (e) {
    console.log('❌ Erro ao criar cliente:', e.message);
    setTimeout(conectarBot, 60000);
    return;
  }

  client.on('spawn', () => {
    console.log('✅ Bot entrou no servidor!');
  });

  client.on('error', (err) => {
    console.log('⚠️ Erro:', err.message);
  });

  client.on('close', () => {
    console.log('🔄 Bot saiu. Reconectando em 1 minuto...');
    setTimeout(conectarBot, 60 * 1000); // tenta de novo em 1 min
  });
}

// Tenta conectar ao iniciar
conectarBot();

// Reconecta a cada 50 minutos por segurança
setInterval(() => {
  console.log('🔁 Ciclo de reconexão ativo...');
}, 50 * 60 * 1000);
