"use strict";
const vscode = require("vscode");
const languageclient = require("vscode-languageclient");

let client;
function activate(context) {
    try {
        let serverExe = context.extensionPath + "/bin/Debug/JsonRpcServer.exe";
        let dotnetExe = "dotnet";
        let dllPath = context.extensionPath + "/bin/Debug/net6.0/JsonRpcSample.dll"
        // const serverOptions = {
        //         command: "node",
        //         args: [
        //                     context.extensionPath + "/oreore.js",
        //                       "--language-server"
        //         ]
        // };
        const serverOptions = {
            command: serverExe,
            args: [
                "stdio"
            ]
        };
        // const serverOptions = {
        //     command: dotnetExe,
        //     args: [
        //         dllPath, "stdio"
        //     ]
        // }
        const clientOptions = {
            documentSelector: [
                {
                    scheme: "file",
                    language: "oreore",
                }
            ],
        };
        client = new languageclient.LanguageClient("oreore-mode", serverOptions, clientOptions);
        context.subscriptions.push(client.start());
    } catch (e) {
        vscode.window.showErrorMessage("oreore-mode couldn't be started.");
    }
}

function deactivate() {
    if (client) return client.stop();
}

module.exports = { activate, deactivate }