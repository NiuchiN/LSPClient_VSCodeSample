const fs = require("fs");
const log = fs.openSync("D:/git_repos/VsCodeExtension/js_sample/log/log.json", "w"); // ファイル名は適宜変えてください

function sendInvalidRequestResponse() {
    sendErrorResponse(null, -32600, "received an invalid request");
}

function sendMethodNotFoundResponse(id, method) {
    sendErrorResponse(id, -32601, method + " is not supported");
}

function sendMessage(msg) {
    const s = new TextEncoder("utf-8").encode(JSON.stringify(msg));
    process.stdout.write(`Content-Length: ${s.length}\r\n\r\n`);
    process.stdout.write(s);

    fs.writeSync(log, `Content-Length: ${s.length}\r\n\r\n`);
    fs.writeSync(log, s);
    fs.writeSync(log, '\r\n')

}

function logMessage(message) {
    sendMessage({ jsonrpc: "2.0", method: "window/logMessage", params: { type: 3, message } });
}

function sendPublishDiagnostics(uri, diagnostics) {
    sendMessage({ jsonrpc: "2.0", method: "textDocument/publishDiagnostics", params: { uri, diagnostics } });
}

function compile(uri, src) {
    logMessage(uri + ":" + src);
    const diagnostics = [
        {
            range:
            {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 5 }
            },
            message: "diagnostic message 1"
        },
        {
            range:
            {
                start: { line: 1, character: 0 },
                end: { line: 1, character: 5 }
            },
            message: "diagnostic message 2"
        }
    ];
    sendPublishDiagnostics(uri, diagnostics)
    // TODO: implement
}

const requestTable = {};
const notificationTable = {};
requestTable["initialize"] = (msg) => {
    logMessage("hello");
    const capabilities = {
        textDocumentSync: 1,
    };

    sendMessage({ jsonrpc: "2.0", id: msg.id, result: { capabilities } });
}

notificationTable["textDocument/didOpen"] = (msg) => {
    const uri = msg.params.textDocument.uri;
    const text = msg.params.textDocument.text;
    compile(uri, text);
}

function dispatch(msg)
{
    if ("id" in msg && "method" in msg) { // request
        if (msg.method in requestTable) {
            requestTable[msg.method](msg);
        } else {
            sendMethodNotFoundResponse(msg.id, msg.method)
        }
    } else if ("method" in msg) {
        if (msg.method in notificationTable) {
            logMessage("Notification")
            notificationTable[msg.method](msg);
        }
    }
}

function languageServer() 
{
    let buffer = Buffer.from(new Uint8Array(0));
    process.stdin.on("readable", () => {    //stdinに読み込み可能なデータがあると呼ばれる。
        let chunk;
        while (chunk = process.stdin.read()) {  //stdinに詰め込まれた文字列を全て読みだしてbufferに格納
            buffer = Buffer.concat([buffer, chunk]);
        }
        const bufferString = buffer.toString();

        if (!bufferString.includes('\r\n\r\n')) {
            // bufferに改行が2つ以上無かったら読み飛ばす。
            return;
        }

        fs.writeSync(log, bufferString);
        fs.writeSync(log, '\r\n')
        
        const headerString = bufferString.split("\r\n\r\n", 1)[0];

        let contentLength = -1;
        let headerLength = headerString.length + 4;
        for (const line of headerString.split("\r\n")) {
            const [key, value] = line.split(": ");
            if (key === "Content-Length") {
                contentLength = parseInt(value, 10);    //10進数で変換。
            }
        }
        // エラー処理
        if (contentLength === -1) return;
        if (buffer.length < headerLength + contentLength) return;

        try {
            const msg = JSON.parse(buffer.slice(headerLength, headerLength + contentLength));
            dispatch(msg); 

        } catch (e) {
            if (e instanceof SyntaxError) {
                sendParseErrorResponse();
                return;
            } else {
                throw e;
            }
        } finally {
            buffer = buffer.slice(headerLength + contentLength);
        }


    });
}

if (process.argv.length !== 3) {
    console.log(`usage: ${process.argv[1]} [--language-server|FILE]`);
} else if (process.argv[2] == "--language-server") {
    languageServer();
} else {
    // TODO: interpret(process.argv[2]);
}