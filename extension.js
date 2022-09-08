"use strict";
const vscode = require("vscode");
const languageclient = require("vscode-languageclient");

let client;
function activate(context) {
    try {
        const conf  = vscode.workspace.getConfiguration('Settings');
        let exePath = conf.get('ServerExePath');
        if (exePath == null) {
            throw new Error('Language Server までのパスを指定してください');
            //exePath = context.extensionPath + "/bin/Debug/JsonRpcServer.exe";           
        }
        const serverOptions = {
            command: exePath,
            args: [
                "stdio"
            ]
        };
        // jsのTEST server 用
        // const serverOptions = {
        //         command: "node",
        //         args: [
        //                     context.extensionPath + "/oreore.js",
        //                       "--language-server"
        //         ]
        // };

        // DLL実施用
        //let dotnetExe = "dotnet";
        //let dllPath = context.extensionPath + "/bin/Debug/net6.0/JsonRpcSample.dll"
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
        vscode.window.showErrorMessage("oreore-mode couldn't be started.", e.message);
    }
}

function deactivate() {
    if (client) return client.stop();
}

module.exports = { activate, deactivate }