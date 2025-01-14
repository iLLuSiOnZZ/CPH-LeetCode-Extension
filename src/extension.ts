import * as vscode from 'vscode';
import puppeteer from 'puppeteer';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import * as path from 'path';

const workspacePath = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
const testcasesFolderPath = path.join(workspacePath, 'testcases');

async function scrapeLeetCodeProblem(url: string) {
    try {
        // Web scraping
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
        });
        const page = await browser.newPage();
        await page.goto(url, {
            waitUntil: 'networkidle0',
        });
        const problemData = await page.evaluate(() => {
            let preAll = document.querySelectorAll('div.elfjS pre');
            if (preAll.length === 0) {
                preAll = document.querySelectorAll('div.example-block');
            }
            return Array.from(preAll).map(pre => pre.textContent!.trim().replace(/"/g, ''));
        });
        await browser.close();
        // Data extracting
        function handleArray(arr: Array<any>) {
            let res = '';
            res += `${arr.length} `;
            arr.forEach((element) => {
                if (Array.isArray(element)) {
                    res += handleArray(element);
                }
                else {
                    res += `${element} `;
                }
            });
            return res;
        }
        for (let i = 0; i < problemData.length; i++) {
            let idx = 0;
            let inputData = '';
            while (inputData.length === 0) {
                while (idx < problemData[i].length && problemData[i][idx] !== '\n') {
                    inputData += problemData[i][idx];
                    idx++;
                }
                idx++;
            }
            let answerData = '';
            while (answerData.length === 0) {
                while (idx < problemData[i].length && problemData[i][idx] !== '\n') {
                    answerData += problemData[i][idx];
                    idx++;
                }
                idx++;
            }
            let finalInput = '';
            for (let i = 0; i < inputData.length; i++) {
                if (inputData[i] === '=') {
                    i += 2;
                    let variableStringIn = '';
                    while (i < inputData.length && inputData[i] !== ' ' && inputData[i] !== '\n') {
                        variableStringIn += inputData[i];
                        i++;
                    }
                    if (variableStringIn[variableStringIn.length - 1] === ',') {
                        variableStringIn = variableStringIn.slice(0, variableStringIn.length - 1);
                    }
                    variableStringIn = variableStringIn.replace(/([a-zA-Z]+)/g, '"$1"');
                    const variableIn = JSON.parse(variableStringIn);
                    if (Array.isArray(variableIn)) {
                        finalInput += handleArray(variableIn);
                    }
                    else {
                        finalInput += `${variableIn} `;
                    }
                    if (finalInput[finalInput.length - 1] === ' ') {
                        finalInput = finalInput.slice(0, finalInput.length - 1);
                    }
                    finalInput += '\r\n';
                }
            }
            let finalAnswer = '';
            let variableStringAns = '';
            for (let i = 8; i < answerData.length; i++) {
                variableStringAns += answerData[i];
            }
            variableStringAns = variableStringAns.replace(/([a-zA-Z]+)/g, '"$1"');
            const variableAns = JSON.parse(variableStringAns);
            if (Array.isArray(variableAns)) {
                finalAnswer += handleArray(variableAns);
            }
            else {
                finalAnswer += `${variableAns} `;
            }
            finalAnswer = finalAnswer.slice(0, finalAnswer.length - 1);
            finalAnswer += '\r\n';
            fs.writeFileSync(`${testcasesFolderPath}/input_${i + 1}.txt`, finalInput);
            fs.writeFileSync(`${testcasesFolderPath}/answer_${i + 1}.txt`, finalAnswer);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error scraping the problem statement: ${error}`);
    }
}

function finalStatementShowing() {
    const finalStatement = new Map();
    fs.readdirSync(testcasesFolderPath).forEach((file) => {
        if (file.startsWith('answer_') && file.endsWith('.txt')) {
            const answerFilePath = path.join(testcasesFolderPath, file);
            const fileNo = parseInt(file.split('_')[1].split('.')[0]);
            const outputFileName = `output_${fileNo}.txt`;
            const outputFilePath = path.join(testcasesFolderPath, outputFileName);
            const answerData = fs.readFileSync(answerFilePath, 'utf-8');
            const outputData = fs.readFileSync(outputFilePath, 'utf-8');
            if (answerData === outputData) {
                finalStatement.set(fileNo, true);
            }
            else {
                finalStatement.set(fileNo, false);
            }
        }
    });
    const showFinalStatement = async () => {
        for (const [key, value] of finalStatement.entries()) {
            if (value) {
                const statement = `Test case ${key} passed.`;
                await vscode.window.showInformationMessage(statement, "OK");
            }
            else {
                const statement = `Test case ${key} failed.`;
                await vscode.window.showErrorMessage(statement, "OK");
            }
        }
        await vscode.window.showInformationMessage('Test cases ran successfully.');
    };
    showFinalStatement();
}

export function activate(context: vscode.ExtensionContext) {
    const disposable1 = vscode.commands.registerCommand('cph.fetchTestCases', async () => {
        const url = await vscode.window.showInputBox({
            prompt: 'Enter the LeetCode problem URL',
        });
        if (url) {
            vscode.window.showInformationMessage('Fetching test cases...');
            // Creating empty testcases folder    
            if (fs.existsSync(testcasesFolderPath)) {
                fs.rmSync(testcasesFolderPath, {
                    recursive: true,
                    force: true,
                });
            }
            fs.mkdirSync(testcasesFolderPath, {
                recursive: true,
            });
            await scrapeLeetCodeProblem(url);
            vscode.window.showInformationMessage('Test cases fetched successfully.');
        } else {
            vscode.window.showErrorMessage('No URL provided.');
        }
    });
    const disposable2 = vscode.commands.registerCommand('cph.runTestCases', async () => {
        // Compiling, executing and comparing test cases
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const document = activeEditor.document;
            const filePath = document.uri.fsPath;
            const filePathWithoutExtension = path.join(path.parse(filePath).dir, path.parse(filePath).name);
            const fileLanguage = document.languageId;
            if (fileLanguage === 'cpp') {
                vscode.window.showInformationMessage('Running test cases...');
                const compileCommand = `g++ -std=c++17 "${filePath}" -o "${filePathWithoutExtension}"`;
                execSync(compileCommand);
                fs.readdirSync(testcasesFolderPath).forEach((file) => {
                    if (file.startsWith('input_') && file.endsWith('.txt')) {
                        const inputFilePath = path.join(testcasesFolderPath, file);
                        const fileNo = parseInt(file.split('_')[1].split('.')[0]);
                        const outputFileName = `output_${fileNo}.txt`;
                        const outputFilePath = path.join(testcasesFolderPath, outputFileName);
                        const runCommand = `"${filePathWithoutExtension}" < "${inputFilePath}" > "${outputFilePath}"`;
                        execSync(runCommand);
                    }
                });
                finalStatementShowing();
            }
            else if (fileLanguage === 'python') {
                vscode.window.showInformationMessage('Running test cases...');
                fs.readdirSync(testcasesFolderPath).forEach((file) => {
                    if (file.startsWith('input_') && file.endsWith('.txt')) {
                        const inputFilePath = path.join(testcasesFolderPath, file);
                        const fileNo = parseInt(file.split('_')[1].split('.')[0]);
                        const outputFileName = `output_${fileNo}.txt`;
                        const outputFilePath = path.join(testcasesFolderPath, outputFileName);
                        const runCommand = `python "${filePath}" < "${inputFilePath}" > "${outputFilePath}"`;
                        execSync(runCommand);
                    }
                });
                finalStatementShowing();
            }
            else {
                vscode.window.showWarningMessage(`Support for "${fileLanguage}" files is not available.`);
                return;
            }
        } else {
            vscode.window.showWarningMessage('No file is currently open in the editor.');
            return;
        }
    });

    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
}

