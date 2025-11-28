const WebSocket = require('ws');  // Instale com: npm install ws
const http = require('http');
const urlModule = require('url');

let latestMessage = 'Aguardando mensagem...';  // Mensagem inicial

async function startWebSocket() {
    const group = '6c971163-8ef7-46de-a3b9-0ad166db606f';

    console.log('Pedindo URL de conexão...');
    const response = await fetch(`https://xraigo-connstr-service-uksouth.azurewebsites.net/api/getconnstr?group=${group}`);
    const url = await response.text();

    console.log('URL retornada:', url);

    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';

    ws.on('open', () => console.log('WebSocket aberto!'));
    ws.on('error', (e) => console.log('Erro no WebSocket:', e));
    ws.on('close', () => {
        console.log('WebSocket fechado. Reconectando em 3s...');
        setTimeout(startWebSocket, 3000);
    });

    ws.on('message', (data) => {
        if (typeof data === 'string') {
            console.log('Mensagem de texto:', data);
            latestMessage = data;  // Armazena
            return;
        }

        const arr = new Uint8Array(data);
        try {
            // Mensagem real começa no byte 11
            const text2 = new TextDecoder().decode(arr.slice(11));
            // Remove prefixo "en-GB"
            const clean = text2.replace(/^en-GB/, '');
            console.log('Mensagem processada:', clean);
            latestMessage = clean;  // Armazena a última mensagem limpa
        } catch (e) {
            console.log('Erro ao decodificar:', e);
        }
    });
}

startWebSocket();

// Servidor HTTP simples para expor a última mensagem
const server = http.createServer((req, res) => {
    const parsedUrl = urlModule.parse(req.url, true);
    if (parsedUrl.pathname === '/latest') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(latestMessage);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Render exige process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Servidor HTTP rodando na porta " + PORT);
});