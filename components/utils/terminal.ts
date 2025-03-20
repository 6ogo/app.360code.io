export function coloredText(text: string, color: 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan' | 'gray') {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        blue: '\x1b[34m',
        yellow: '\x1b[33m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        gray: '\x1b[90m'
    };

    const reset = '\x1b[0m';
    return `${colors[color]}${text}${reset}`;
}
