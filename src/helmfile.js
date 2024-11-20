const { spawnSync } = require('child_process');

function helmfileTemplate(deploymentDir, outputDir, environment, stateValues, stateValuesFile, namespace = undefined) {

    const args = [
        'template',
        '--environment',
        environment,
        '--output-dir',
        outputDir,
        '--state-values-file',
        stateValuesFile,
    ];

    if (namespace) {
        args.push('--namespace', namespace);
    }

    if (stateValues) {
        const stateValuesSet = Object.keys(stateValues).map(key => `${key}=${stateValues[key]}`).join(',');
        args.push('--state-values-set', stateValuesSet);
    }

    console.log(`Running helmfile template in ${deploymentDir} with args: ${args}`);

    return spawnSync('helmfile', args, {
        cwd: deploymentDir,
    });


}

module.exports = { helmfileTemplate }
