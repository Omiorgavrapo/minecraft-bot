'use strict';

const http = require('node:http');
// Caminho interno da bedrock-protocol 3.60.1: sinalização NetherNet por HTTP (POST /v1/join/...).
const { createVanillaClient } = require('bedrock-protocol/tools/vanillaClient');

const HOST = process.env.MC_HOST || '135.148.171.110';
const PORT = Number(process.env.MC_PORT || 10155);
const BOT_NAME = process.env.MC_BOT_NAME || 'ze_servizin';
const HTTP_PORT = Number(process.env.PORT || 3000);
const RECONNECT_MS = 60_000;

let spawned = false;
let ultimoErro = null;
let reconnectTimer = null;

function agendar() {
  if (reconnectTimer) return;
  console.log('Nova tentativa em 60 segundos.');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    conectar();
  }, RECONNECT_MS);
}

function conectar() {
  console.log(`Conectando em ${HOST}:${PORT} via NetherNet HTTP...`);
  let fechado = false;
  let client;

  const cair = (motivo) => {
    if (fechado) return;
    fechado = true;
    spawned = false;
    ultimoErro = motivo;
    console.log(motivo);
    try { client?.close(); } catch {}
    agendar();
  };

  try {
    client = createVanillaClient({
      host: HOST,
      port: PORT,
      username: BOT_NAME,
      offline: true,
      transport: 'nethernet',
      connectTimeout: 20_000,
    });
  } catch (e) {
    cair(`Falha ao criar cliente: ${e.message}`);
    return;
  }

  const limite = setTimeout(() => cair('Tempo esgotado esperando spawn.'), 60_000);

  // createVanillaClient não conecta sozinho: precisa de connect() e das respostas básicas de entrada.
  try {
    client.connect();
  } catch (e) {
    clearTimeout(limite);
    cair(`Falha ao conectar: ${e.message}`);
    return;
  }

  client.on('network_stack_latency', (packet) => {
    if (packet.needs_response) {
      client.queue('network_stack_latency', { timestamp: packet.timestamp, needs_response: false });
    }
  });

  const concluirResourcePacks = () => client.write('resource_pack_client_response', {
    response_status: 'completed',
    response_status_name: 'resourcepackstackfinished',
    resourcepackids: []
  });
  client.once('resource_packs_info', () => {
    concluirResourcePacks();
    client.once('resource_pack_stack', concluirResourcePacks);
    client.queue('client_cache_status', { enabled: false });
    setTimeout(() => {
      if (!fechado) client.queue('request_chunk_radius', { chunk_radius: 10 });
    }, 500);
  });

  client.on('spawn', () => {
    clearTimeout(limite);
    spawned = true;
    ultimoErro = null;
    console.log('Bot entrou no servidor!');
  });
  client.on('kick', (r) => {
    clearTimeout(limite);
    cair('Kick: ' + JSON.stringify(r, (_, v) => typeof v === 'bigint' ? v.toString() : v));
  });
  client.on('error', (e) => { clearTimeout(limite); cair('Erro: ' + e.message); });
  client.on('close', () => { clearTimeout(limite); cair('Conexão encerrada.'); });
}

const server = http.createServer((req, res) => {
  const rota = req.url.split('?')[0];
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (rota === '/' || rota === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, spawned }));
  } else if (rota === '/status') {
    res.writeHead(spawned ? 200 : 503);
    res.end(JSON.stringify({ spawned, host: HOST, port: PORT, ultimoErro }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ erro: 'Rota não encontrada' }));
  }
});

server.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`HTTP ativo na porta ${HTTP_PORT}. UptimeRobot: /health`);
  conectar();
});
