const express = require('express');
const dgram = require('dgram');

const HOST = '191.96.231.38';
const PORT = 10495;

const app = express();
app.get('/', (req, res) => res.send('Bot rodando! ✅'));
app.listen(3000, () => console.log('HTTP ativo na porta 3000'));

function pingServidor() {
  const client = dgram.createSocket('udp4');
  const msg = Buffer.from('01000000000000000000ffff00fefefefefdfdfdfd12345678', 'hex');
  
  client.send(msg, PORT, HOST, (err) => {
    if (err) console.log('⚠️ Erro no ping:', err.message);
    else console.log(`🏓 Ping enviado para ${HOST}:${PORT}`);
    client.close();
  });
}

pingServidor();
setInterval(pingServidor, 4 * 60 * 1000);
console.log('🤖 Bot de ping iniciado!');
