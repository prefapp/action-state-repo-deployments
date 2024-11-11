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

  for (const fname of filtered_files) {
    const content = fs.readFileSync(fname, 'utf-8')
    fs.appendFileSync(final_yaml, content)
  }


  const ca_files = glob.sync(path.join(deploymentPath, 'ca-certs', '*.crt'))

  let ca = ''

  for (const file of ca_files) {
    ca += fs.readFileSync(file, 'utf-8')
  }

  const dict_file = createNestedObject(ca_keys, ca)

  const ca_yaml = path.join(deploymentPath, 'ca.yml')

  fs.writeFileSync(ca_yaml, JSON.stringify(dict_file))
}

function hydrateDeployments(deployments) {
  for (const deployment of deployments) {
    hydrateDeployment(deployment)
  }
}

module.exports = { createNestedObject, hydrateDeployment, hydrateDeployments }
