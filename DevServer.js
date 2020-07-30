const WebSocket = require('ws');
let fs = require('fs');
let http = require('http');
let path = require('path');
const open = require('open');

module.exports = function(config){
    let isOpened = false;
    let js = ``; // filled by reload function
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>JSX Bundle</title>
            <style>
            html, body{
                height: 100%;
                margin: 0
            }
            #app{
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            </style>
        </head>
        <body>
            <div id="app">123</div>
            <script src="dlls/react.dll.js"></script>
            <script src="dlls/react-dom.dll.js"></script>
            <script src="build.js"></script>
            <script>
                var socket = new WebSocket('ws://localhost:${config.wsPort}');
                socket.addEventListener('open', function (event) {
                    console.log('connected');
                });
                
                // Listen for messages
                socket.addEventListener('message', function (event) {
                    if(event.data === 'reload'){ location.reload(); }
                    if(event.data === 'close'){ window.close(); }
                });
            </script>
        </body>
        </html>
    `;
    http.createServer(function (req, res) {
        if(req.url === '/'){
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(html, 'utf-8');
        }
        if(req.url === '/build.js'){
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            return res.end(js, 'utf-8');
        }
    
        var extname = path.extname(req.url);
        var contentType = 'text/html';
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
        }
        fs.readFile(path.join(__dirname, req.url), 'utf8', (error, content) => {
            if (error) {
                if(error.code == 'ENOENT'){
                    res.writeHead(404);
                    res.end(`File not found - ${req.url}`);
                }
                else {
                    res.writeHead(500);
                    res.end('Server Error');
                    console.log(error);
                }
            }
            else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    
    }).listen(config.port);

    const wss = new WebSocket.Server({ port: config.wsPort });
    const broadcast = type => wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(type);
        }
    });
    

    return {
        reload(code){
            js = code;
            if(!isOpened){
                open(`http://localhost:${config.port}`);
                isOpened = true;
            }
            broadcast('reload');
        },
        close(){
            broadcast('close');
        }
    };
}