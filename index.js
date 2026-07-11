const bedrock = require('bedrock-protocol');
const express = require('express');

const HOST = 'tavernaredstone.mcsh.io';
const PORT = 19132;
const BOT_NAME = 'zé_servizin';

const app = express();
app.get('/', (req, res) => res.send('Bot rodando! ✅'));
app.listen(3000, () => console.log('HTTP ativo na porta 3000'));

let client = null;
let reconnectTimer = null;
let spawned = false;

function agendar(ms) {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(conectarBot, ms);
}

function fechar() {
  spawned = false;
  if (client) {
    try { client.removeAllListeners(); client.close(); } catch(e) {}
    client = null;
  }
}

function conectarBot() {
  fechar();
  console.log(`🤖 Conectando em ${HOST}:${PORT}...`);

  try {
    client = bedrock.createClient({
      host: HOST,
      port: PORT,
      username: BOT_NAME,
      offline: true,
      skipPing: true,
      version: '1.26.20',
      authTitle: undefined,
      identityPublicKey: undefined,
      profilesFolder: false,
      onMsaCode: undefined,
      // XUID falso pra enganar o addon
      extra: {
        DeviceOS: 1,
        PlatformUserId: '2535400000000001',
        ThirdPartyName: BOT_NAME,
        SelfSignedId: '00000000-0000-0000-0000-000000000001'
      }
    });
  } catch (e) {
    console.log('❌ Erro:', e.message);
    agendar(60000);
    return;
  }

  const timeout = setTimeout(() => {
    console.log('⏱️ Timeout!');
    fechar();
    agendar(60000);
  }, 20000);

  client.on('spawn', () => {
    clearTimeout(timeout);
    spawned = true;
    console.log('✅ Bot entrou e ficou!');
  });

  client.on('kick', (reason) => {
    clearTimeout(timeout);
    console.log('❌ Kickado:', JSON.stringify(reason));
    fechar();
    agendar(60000);
  });

  client.on('error', (err) => {
    clearTimeout(timeout);
    console.log('⚠️ Erro:', err.message);
    fechar();
    agendar(60000);
  });

  client.on('close', () => {
    clearTimeout(timeout);
    if (spawned) {
      console.log('🔄 Caiu. Reconectando em 60s...');
      fechar();
      agendar(60000);
    }
  });
}

conectarBot();
setInterval(() => console.log('🔁 Ciclo ativo...'), 50 * 60 * 1000);
