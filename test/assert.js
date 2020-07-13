const fs = require('fs');
const path = require('path');

const pkg = path.join(__dirname, 'pkg');
const folders = fs.readdirSync(pkg);

const assert = (assertion, ...messages) => {
    if (!assertion) {
        console.error(messages);
        throw new Error(messages);
    }
};

try {
    assert(fs.existsSync(pkg), 'pkg directory expected to exist');
    console.log('✔', 'pkg directory expected to exist');

    assert(
        fs.readFileSync('pkg/dist-src/index.js', { encoding: 'utf-8' }).toString().trim() ===
            `export const STRING_EXAMPLE = "1.2.3";
export const NUMERIC_EXAMPLE = 3000;
export const BOOLEAN_EXAMPLE = false;`,
        'env vars not replaced'
    );

    console.log('✔', 'env vars correctly replaced');
} catch (e) {
    console.error(e.messages);
    process.exit(1);
}
