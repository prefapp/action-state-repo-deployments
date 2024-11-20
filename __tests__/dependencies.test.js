const hasbin = require('hasbin');
const { checkDependencies } = require('../src/dependencies');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

describe('checkDependencies', () => {

    it('should throw an error if there is no path specified', () => {
        const originalPath = process.env.PATH;
        process.env.PATH = '';

        expect(() => checkDependencies()).toThrow('Required dependencies not found.');

        process.env.PATH = originalPath; // Restore original PATH
    });

    it.only('should not throw if we add all required binaries to the PATH', () => {
        hasbin.all.sync = jest.fn().mockReturnValue(false);

        // Create a temporary directory
        const tmpDir = fs.mkdtempSync(os.tmpdir() + path.sep);

        // Create a fake binary in the temporary directory
        const expectedBinaries = ['helmfile', 'helm'];
        for (const binary of expectedBinaries) {
            const binaryPath = path.join(tmpDir, binary);
            fs.writeFileSync(binaryPath, '');
            fs.chmodSync(binaryPath, '755');
        }

        const originalPath = process.env.PATH;

        process.env.PATH = `${tmpDir}`;

        expect(() => {
            checkDependencies()
        }).not.toThrow();

        process.env.PATH = originalPath; // Restore original PATH
    });
});
