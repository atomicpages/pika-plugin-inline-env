function isNumeric(n: any) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

export function getType(value: string): 'boolean' | 'number' | 'string' {
    if (/true|false/i.test(value)) {
        return 'boolean';
    }

    if (isNumeric(value)) {
        return 'number';
    }

    return 'string';
}

export function getVarName(env: string): string {
    return env.slice(env.lastIndexOf('.') + 1);
}

export function normalizeEnv(env: string): string {
    if (env.indexOf('process.env') === -1) {
        return `process.env.${env}`;
    }

    return env;
}

export function envExists(env: string): boolean {
    return Object.prototype.hasOwnProperty.call(process.env, getVarName(env));
}
