const path = require('path')
const { helmfileTemplate } = require('./helmfile')
const fs = require('fs-extra')
const yaml = require('js-yaml')
const glob = require('glob')
const {
  createBranch,
  deleteBranch,
  uploadToRepo,
  getCurrentCommit,
  createComment,
  mergePr,
  createPr,
  addLabels,
  addReviewers
} = require('./git')
const { getOctokit } = require('@actions/github')
const core = require('@actions/core')

class Deployment {
  constructor(kind, config, folders) {
    this.kind = kind
    this.config = config
    this.folders = folders
  }

  template() {
    console.info(`Templating deployment ${this}`)

    this._template()
    this._postTemplate()
  }

  _template(_config) {
    throw new Error(
      `Method 'template' must be implemented in kind ${this.kind}`
    )
  }

  _toString(_summarize) {
    throw new Error(
      `Method 'toString' must be implemented in kind ${this.kind}`
    )
  }

  _getLabels() {
    throw new Error(
      `Method 'getLabels' must be implemented in kind ${this.kind}`
    )
  }

  _postTemplate() {
    const outputFiles = glob.sync(`${this.config.outputDir}/**/*.@(yaml|yml)`)

    for (const file of outputFiles) {
      const fileContent = fs.readFileSync(file, 'utf8')
      const yamlContent = yaml.loadAll(fileContent)

      for (const doc of yamlContent) {
        const crKind = doc?.kind
        const crName = doc?.metadata?.name

        if (!crKind || !crName) {
          console.log(doc)
          throw new Error(
            `File ${file} does not have kind or metadata.name. Got ${crKind} and ${crName}`
          )
        }

        const newFileName = `${crKind}.${crName}.yml`
        const newFilePath = path.join(
          this.config.outputDir,
          this.kind,
          ...this.folders,
          newFileName
        )

        const newFileContent = yaml.dump(doc)
        fs.outputFileSync(newFilePath, newFileContent)
      }

      fs.removeSync(file)
    }

    // After renaming the files there is an empty folder named helmfile-xxxxxxxxx-<chart-name>
    // We need to remove this folder
    const helmfileFolders = glob.sync(`${this.config.outputDir}/**/helmfile-*`)

    for (const folder of helmfileFolders) {
      fs.removeSync(folder)
    }
  }

  async verify() {
    console.info(`Verifying deployment ${this.kind}`)

    this._verify()

    await this._postVerify()
  }

  _isAutoMerge() {
    const autoMergeFile = path.join(
      this.config.deploymentsDir,
      this.kind,
      ...this.folders,
      'AUTO_MERGE'
    )

    if (fs.existsSync(autoMergeFile)) {
      return true
    }

    return false
  }

  async _postVerify() {
    // Create branch and commit the changes

    const octo = getOctokit(process.env.GITHUB_TOKEN)

    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

    // get the sha of the deployment branch
    const commit = await getCurrentCommit(octo, owner, repo, 'deployment')

    const branchName = `${this.config.prNumber}-${this.kind}-${this.folders.join('-')}`

    await createBranch(
      octo,
      owner,
      repo,
      `refs/heads/${branchName}`,
      commit.commitSha
    )

    // Add a commit with the changes
    await uploadToRepo(
      octo,
      path.join(this.config.outputDir),
      owner,
      repo,
      branchName
    )

    // Check if there is a PR already open for this deployment
    const prs = await octo.rest.pulls.list({
      owner,
      repo,
      state: 'open'
    })

    const pr = prs.data.find(
      pullRequest =>
        pullRequest.head.ref === branchName
    )

    let newPrNumber

    if (!pr) {
      // Create a PR

      core.info(
        `Creating PR for ${branchName}`
      )

      const prResponse = await createPr(
        octo,
        owner,
        repo,
        this._toString(true),
        branchName,
        'deployment',
        this._toString(false)
      )

      newPrNumber = prResponse.data.number

      // Add a comment with the original PR number
      await createComment(
        octo,
        owner,
        repo,
        newPrNumber,
        `Original PR: #${this.config.prNumber}`
      )

      // Add labels to the PR
      await addLabels(octo, owner, repo, newPrNumber, this._getLabels())

      // Add original author as reviewer
      core.info(`Adding ${this.config.author} as reviewer`)
      await addReviewers(octo, owner, repo, newPrNumber, [this.config.author])
    } else {
      core.info(`PR already exists for ${branchName} with number ${pr.number}`)
      newPrNumber = pr.number
    }

    console.log(`New PR number: ${newPrNumber}`)

    // Merge if AUTO_MERGE is set
    const autoMerge = this._isAutoMerge()

    if (autoMerge) {
      core.info(`Merging PR ${newPrNumber} automatically`)
      await mergePr(octo, owner, repo, newPrNumber)

      // We make sure the branch is deleted
      await deleteBranch(octo, owner, repo, branchName)
    }
  }

  _verify(_config) {
    throw new Error(`Method 'verify' must be implemented in kind ${this.kind}`)
  }
}

class AppDeployment extends Deployment {
  constructor(kind, config, folders) {
    super(kind, config, folders)

    const [cluster, tenant, app, environment] = folders
    this.cluster = cluster
    this.tenant = tenant
    this.app = app
    this.environment = environment
  }

  _toString(summarize) {
    if (summarize) {
      return `Deployment in cluster: \`${this.cluster}\`, tenant: \`${this.tenant}\`, app: \`${this.app}\` for \`${this.environment}\` environment`
    } else {
      // Make it this way to avoid adding extra tabs at the start and github interprets it as a block code
      return [
        `Deployment in cluster:`,
        `- cluster: \`${this.cluster}\``,
        `- tenant: \`${this.tenant}\``,
        `- app: \`${this.app}\``,
        `- environment: \`${this.environment}\``
      ].join('\n')
    }
  }

  _getLabels() {
    return [
      `app/${this.app}`,
      `tenant/${this.tenant}`,
      `env/${this.environment}`,
      `cluster/${this.cluster}`
    ]
  }

  _template() {
    console.log('Template app deployment')

    const result = helmfileTemplate(
      path.join(this.config.deploymentsDir, this.kind),
      path.join(
        this.config.outputDir,
        this.kind,
        ...this.folders,
        this.environment
      ),
      this.environment,
      {
        tenant: this.tenant,
        app: this.app,
        cluster: this.cluster
      },
      path.join(
        this.config.deploymentsDir,
        this.kind,
        ...this.folders.slice(0, -1),
        `${this.environment}.yaml`
      ),
      [this.tenant, this.app, this.environment].join('-')
    )

    console.log(result.stderr.toString())
  }

  _verify() {
    const result = {
      passed: true,
      autoMerge: false
    }

    const files = glob.sync(`${this.config.outputDir}/**/*.@(yaml|yml)`)

    // Validate the metadata.name of the files

    const namespace = `${this.tenant}-${this.app}-${this.environment}`

    for (const file of files) {
      const filePath = path.join(file)
      const content = fs.readFileSync(filePath, 'utf8')
      const data = yaml.load(content)

      if (data?.metadata?.namespace !== namespace) {
        throw new Error(
          `File ${file} does not have the correct metadata.namespace. Expected ${this.tenant}-${this.app}-${this.environment} and got data ${data?.metadata?.name}`
        )
      }
    }

    // Validate the argoproject

    // const argoProjectFile = path.join(this.config.argoProjectsDir, this.cluster, `AppProject.${this.cluster}.yaml`)

    // // Check if namespace exists in any of the spec.destinations namespace

    // const argoProjectContent = fs.readFileSync(argoProjectFile, 'utf8')
    // const argoProjectData = yaml.load(argoProjectContent)

    // const namespaceExists = argoProjectData.spec.destinations.some(dest => dest.namespace === namespace)

    // if (!namespaceExists) {
    //     throw new Error(`Namespace ${namespace} does not exist in ArgoCD project ${this.cluster}. Allowed namespaces are ${argoProjectData.spec.destinations.map(dest => dest.namespace).join(', ')}`)
    // }

    // Check if there is a file AUTO_MERGE in the deployments folder
  }
}

class SysServiceDeployment extends Deployment {
  constructor(kind, config, folders) {
    super(kind, config, folders)

    const [cluster, sys_app] = folders
    this.sys_app = sys_app
    this.cluster = cluster
  }

  _template() {
    console.log('Template sys-service deployment')

    const result = helmfileTemplate(
      path.join(this.config.deploymentsDir, this.kind),
      path.join(this.config.outputDir, this.kind, ...this.folders),
      this.folders.join('-'),
      {
        sys_app: this.sys_app,
        cluster: this.cluster
      },
      path.join(
        this.config.deploymentsDir,
        this.kind,
        ...this.folders,
        `platform.yaml`
      )
    )

    console.log(result.stderr.toString())
  }

  _verify() {
    // There are no verifications for sys-services
  }
}

function createDeployment(deployment, config) {
  const [type, ...remainingFolders] = deployment.split(path.sep)

  switch (type) {
    case 'apps':
      return new AppDeployment(type, config, remainingFolders)
    case 'sys_services':
      return new SysServiceDeployment(type, config, remainingFolders)
    default:
      throw new Error(`Unknown deployment type: ${type}`)
  }
}

module.exports = {
  createDeployment,
  Deployment,
  AppDeployment,
  SysServiceDeployment
}
