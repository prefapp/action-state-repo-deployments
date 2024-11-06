const fs = require('node:fs')
const path = require('node:path')
const glob = require('glob')

function createNestedObject(arr, val) {
  return arr.reduceRight((acc, key) => ({ [key]: acc }), val)
}

function hydrateDeployment(
  deploymentPath,
  ca_keys = ['councilbox-server', 'ca_secret', 'crts']
) {
  const excluded_files = ['secrets.yaml', 'images.yaml', 'ca.yml', 'final.yaml']

  const yaml_files = glob.sync(path.join(deploymentPath, '*.yaml'))
  const filtered_files = yaml_files.filter(
    f => !excluded_files.includes(path.basename(f))
  )

  const final_yaml = path.join(deploymentPath, 'final.yaml')

  const final_yaml_stream = fs.createWriteStream(final_yaml, { flags: 'w' })

  for (const fname of filtered_files) {
    const content = fs.readFileSync(fname, 'utf-8')
    final_yaml_stream.write(content)
  }

  final_yaml_stream.end()

  console.log(fs.readFileSync(final_yaml, 'utf-8'))

  const ca_files = glob.sync(path.join(deploymentPath, 'ca-certs', '*.crt'))

  let ca = ''

  for (const file of ca_files) {
    ca += fs.readFileSync(file, 'utf-8')
  }

  const dict_file = createNestedObject(ca_keys, ca)

  const ca_yaml = path.join(deploymentPath, 'ca.yml')

  const ca_yaml_stream = fs.createWriteStream(ca_yaml, { flags: 'w' })

  ca_yaml_stream.write(JSON.stringify(dict_file))

  ca_yaml_stream.end()
}

module.exports = { createNestedObject, hydrateDeployment }
