'use strict';

const http = require('node:http');
const bedrock = require('bedrock-protocol');

function porta(nome, padrao) {
  const valor = Number(process.env[nome] || padrao);
  if (!Number.isInteger(valor) || valor < 1 || valor > 65535) {
    throw new Error(`${nome} precisa ser uma porta entre 1 e 65535.`);
  }
  return valor;
}

const HOST = process.env.MC_HOST || 'quartetofantastico.mcsh.gg';
const PORT = porta('MC_PORT', 19132);
const HTTP_PORT = porta('PORT', 3000);
const BOT_NAME = process.env.MC_BOT_NAME || 'ze_servizin';
// Sem MC_VERSION, a biblioteca detecta o protocolo pelo ping do servidor.
const MC_VERSION = process.env.MC_VERSION?.trim();
// Servidores 1.26.5x+ aceitam sessão só por NetherNet; RakNet fica em timeout.
// Use MC_TRANSPORT=raknet apenas para servidores antigos.
const TRANSPORT = (process.env.MC_TRANSPORT || 'nethernet').trim();
if (!['nethernet', 'raknet'].includes(TRANSPORT)) {
  throw new Error('MC_TRANSPORT precisa ser nethernet ou raknet.');
}
const RECONNECT_MS = 60_000;
const SPAWN_TIMEOUT_MS = 60_000;

let tentativaAtual = null;
let reconnectTimer = null;
let encerrando = false;
let spawned = false;
let ultimoErro = null;

function agendar() {
  if (encerrando || reconnectTimer) return;
  console.log('Nova tentativa em 60 segundos.');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    conectarBot();
  }, RECONNECT_MS);
}

function conectarBot() {
  if (encerrando || tentativaAtual) return;
  console.log(`Conectando em ${HOST}:${PORT} via ${TRANSPORT} (${MC_VERSION || 'versão detectada pelo ping'})...`);

  const tentativa = { client: null, timeout: null, finalizada: false };
  tentativaAtual = tentativa;

  function finalizar(motivo) {
    if (tentativa.finalizada) return;
    tentativa.finalizada = true;
    clearTimeout(tentativa.timeout);
    tentativaAtual = null;
    spawned = false;
    ultimoErro = motivo;
    console.log(motivo);
    // Preserva os listeners internos e absorve eventos tardios desta conexão.
    try { tentativa.client?.close(); } catch (erro) {
      console.error('Erro ao fechar conexão:', erro.message);
    }
    agendar();
  }

  tentativa.finalizar = finalizar;
  try {
    tentativa.client = bedrock.createClient({
      host: HOST,
      port: PORT,
      username: BOT_NAME,
      offline: true,
      transport: TRANSPORT,
      followPort: false,
      skipPing: false,
      connectTimeout: 20_000,
      ...(MC_VERSION ? { version: MC_VERSION } : {})
    });

    tentativa.client.on('spawn', () => {
      if (tentativa.finalizada) return;
      clearTimeout(tentativa.timeout);
      spawned = true;
      ultimoErro = null;
      console.log('Bot entrou no servidor!');
    });
    tentativa.client.on('kick', (motivo) => {
      finalizar(`Kick: ${typeof motivo === 'string' ? motivo : JSON.stringify(motivo, (_, valor) => typeof valor === 'bigint' ? valor.toString() : valor)}`);
    });
    tentativa.client.on('error', (erro) => finalizar(`Erro: ${erro.message}`));
    tentativa.client.on('close', () => finalizar('Conexão encerrada.'));
    tentativa.timeout = setTimeout(() => finalizar('Tempo esgotado esperando spawn.'), SPAWN_TIMEOUT_MS);
  } catch (erro) {
    finalizar(`Falha ao criar cliente: ${erro.message}`);
  }
}

const server = http.createServer((req, res) => {
  const rota = req.url.split('?')[0];
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (rota === '/' || rota === '/health') {
    res.writeHead(encerrando ? 503 : 200);
    res.end(JSON.stringify({ ok: !encerrando, spawned }));
  } else if (rota === '/status') {
    res.writeHead(spawned ? 200 : 503);
    res.end(JSON.stringify({ spawned, host: HOST, port: PORT, ultimoErro }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ erro: 'Rota não encontrada' }));
  }
});

function encerrar() {
  if (encerrando) return;
  encerrando = true;
  clearTimeout(reconnectTimer);
  tentativaAtual?.finalizar('Encerrando o bot.');
  const limite = setTimeout(() => process.exit(0), 5_000);
  limite.unref();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);
server.on('error', (erro) => {
  console.error('Falha no HTTP:', erro.message);
  process.exit(1);
});
server.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`HTTP ativo na porta ${HTTP_PORT}. UptimeRobot: /health`);
  conectarBot();
});
