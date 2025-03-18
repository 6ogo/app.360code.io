"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function generateCode() {
    return __awaiter(this, void 0, void 0, function* () {
        const promptElement = document.getElementById('prompt');
        const prompt = promptElement.value;
        if (!prompt) {
            alert('Please enter a prompt.');
            return;
        }
        try {
            const response = yield fetch('/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = yield response.json();
            if (data.code) {
                const output = document.getElementById('output');
                output.textContent = data.code;
            }
            else {
                alert('Error: ' + data.error);
            }
        }
        catch (error) {
            alert('An error occurred: ' + error.message);
        }
    });
}
function copyCode() {
    const code = document.getElementById('output').textContent || '';
    navigator.clipboard.writeText(code).then(() => {
        alert('Code copied to clipboard');
    }).catch(err => {
        alert('Failed to copy code: ' + err);
    });
}
function remixPrompt() {
    const textarea = document.getElementById('prompt');
    textarea.focus();
    textarea.scrollIntoView({ behavior: 'smooth' });
}
// Attach event listeners if needed (or keep them in HTML)
