async function generateCode(): Promise<void> {
    const promptElement = document.getElementById('prompt') as HTMLTextAreaElement;
    const prompt = promptElement.value;
    if (!prompt) {
        alert('Please enter a prompt.');
        return;
    }

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        const data: { code?: string; error?: string } = await response.json();
        if (data.code) {
            const output = document.getElementById('output') as HTMLElement;
            output.textContent = data.code;
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('An error occurred: ' + (error as Error).message);
    }
}

function copyCode(): void {
    const code = (document.getElementById('output') as HTMLElement).textContent || '';
    navigator.clipboard.writeText(code).then(() => {
        alert('Code copied to clipboard');
    }).catch(err => {
        alert('Failed to copy code: ' + err);
    });
}

function remixPrompt(): void {
    const textarea = document.getElementById('prompt') as HTMLTextAreaElement;
    textarea.focus();
    textarea.scrollIntoView({ behavior: 'smooth' });
}

// Attach event listeners if needed (or keep them in HTML)