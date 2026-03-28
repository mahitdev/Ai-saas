const vscode = require("vscode");

function activate(context) {
  const disposable = vscode.commands.registerCommand("myai.runQuickCommand", async () => {
    const command = await vscode.window.showInputBox({
      prompt: "Enter MyAI quick command (e.g. /summarize-last-meeting)",
      placeHolder: "/summarize-last-meeting"
    });
    if (!command) return;
    vscode.window.showInformationMessage(`MyAI command queued: ${command}`);
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };

