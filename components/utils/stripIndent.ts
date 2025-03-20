export function stripIndents(strings: string | TemplateStringsArray, ...values: any[]) {
    const raw = typeof strings === 'string' ? [strings] : [...strings];
    const result = raw.reduce((acc, str, i) => {
        return acc + str + (values[i] || '');
    }, '');

    const match = result.match(/^[^\S\n]*(?=\S)/gm);
    const indent = match && Math.min(...match.map(el => el.length));

    if (indent) {
        return result
            .replace(new RegExp(`^.{${indent}}`, 'gm'), '')
            .trim();
    }

    return result.trim();
}
