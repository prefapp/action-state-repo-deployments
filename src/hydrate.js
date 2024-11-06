function hydrateDeployment(path) {

    const fs = require('node:fs');
    const path = require('node:path');
    const glob = require('node:glob');

    const excluded_files = ['secrets.yaml', 'images.yaml', 'ca.yml', 'final.yaml']

    const yaml_files = glob.sync(path.join(path, '*.yaml'))
    const filtered_files = yaml_files.filter(f => !excluded_files.includes(path.basename(f)))

    const final_yaml = path.join(path, 'final.yaml')

    const final_yaml_stream = fs.createWriteStream(final_yaml, { flags: 'w' })

    filtered_files.forEach(fname => {
        const content = fs.readFileSync(fname, 'utf-8')
        final_yaml_stream.write(content)
    })

    final_yaml_stream.end()

    console.log(fs.readFileSync(final_yaml, 'utf-8'))

    const ca_files = glob.sync(path.join(path, "ca-certs", '*.crt'))

    let ca = ''

    ca_files.forEach(file => {
        ca += fs.readFileSync(file, 'utf-8')
    })

    const dict_file = { 'councilbox-server': { 'ca_secret': { 'crts': ca } } }

    const ca_yaml = path.join(path, "ca.yml")


    const ca_yaml_stream = fs.createWriteStream(ca_yaml, { flags: 'w' })

    ca_yaml_stream.write(JSON.stringify(dict_file))

    ca_yaml_stream.end()

}
