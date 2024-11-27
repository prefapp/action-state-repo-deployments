const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')

// https://gist.github.com/sondt2709/96b45f85d81a769d834a738b73d42a5c

const listFilesRecursive = (dir, ignoredFolders = ['.git']) => {
  const files = fs.readdirSync(dir)
  const filesPaths = files.map(file => path.join(dir, file))
  const directories = filesPaths.filter(file => {
    const isDirectory = fs.statSync(file).isDirectory()
    const isIgnored = ignoredFolders.some(ignoredFolder =>
      file.includes(ignoredFolder)
    )
    return isDirectory && !isIgnored
  })
  const filesInDirectories = directories
    .map(directory => listFilesRecursive(directory, ignoredFolders))
    .flat()
  const filesOnly = filesPaths.filter(file => !fs.statSync(file).isDirectory())
  return filesOnly.concat(filesInDirectories)
}

const uploadToRepo = async (octo, coursePath, org, repo, branch) => {
  // gets commit's AND its tree's SHA
  const currentCommit = await getCurrentCommit(octo, org, repo, branch)
  const filesPaths = listFilesRecursive(`${coursePath}`)
  const filesBlobs = await Promise.all(
    filesPaths.map(createBlobForFile(octo, org, repo))
  )
  const pathsForBlobs = filesPaths.map(fullPath =>
    path.relative(coursePath, fullPath)
  )
  const newTree = await createNewTree(
    octo,
    org,
    repo,
    filesBlobs,
    pathsForBlobs,
    currentCommit.treeSha
  )
  const newCommit = await createNewCommit(
    octo,
    org,
    repo,
    'Updating deployments',
    newTree.sha,
    currentCommit.commitSha
  )
  await setBranchToCommit(octo, org, repo, branch, newCommit.sha)
}

const getCurrentCommit = async (octo, org, repo, branch) => {
  const { data: refData } = await octo.rest.git.getRef({
    owner: org,
    repo,
    ref: `heads/${branch}`
  })
  const commitSha = refData.object.sha
  const { data: commitData } = await octo.rest.git.getCommit({
    owner: org,
    repo,
    commit_sha: commitSha
  })
  return {
    commitSha,
    treeSha: commitData.tree.sha
  }
}

// Notice that readFile's utf8 is typed differently from Github's utf-8
const getFileAsUTF8 = filePath => fs.readFile(filePath, 'utf8')

const createBlobForFile = (octo, org, repo) => async filePath => {
  const content = await getFileAsUTF8(filePath)
  const blobData = await octo.rest.git.createBlob({
    owner: org,
    repo,
    content,
    encoding: 'utf-8'
  })
  return blobData.data
}

const createNewTree = async (
  octo,
  owner,
  repo,
  blobs,
  paths,
  parentTreeSha
) => {
  // My custom config. Could be taken as parameters
  const tree = blobs.map(({ sha }, index) => ({
    path: paths[index],
    mode: `100644`,
    type: `blob`,
    sha
  }))
  const { data } = await octo.rest.git.createTree({
    owner,
    repo,
    tree,
    base_tree: parentTreeSha
  })
  return data
}

const createNewCommit = async (
  octo,
  org,
  repo,
  message,
  currentTreeSha,
  currentCommitSha
) =>
  (
    await octo.rest.git.createCommit({
      owner: org,
      repo,
      message,
      tree: currentTreeSha,
      parents: [currentCommitSha]
    })
  ).data

const setBranchToCommit = (octo, org, repo, branch, commitSha) =>
  octo.rest.git.updateRef({
    owner: org,
    repo,
    ref: `heads/${branch}`,
    sha: commitSha
  })

const createBranch = (octo, owner, repo, ref, sha) => {
  return octo.rest.git.createRef({
    owner,
    repo,
    ref,
    sha
  })
}

const deleteBranch = (octo, owner, repo, branch) => {
  return octo.rest.git.deleteRef({
    owner,
    repo,
    ref: `heads/${branch}`
  })
}

const createComment = (octo, owner, repo, issue_number, body) => {
  return octo.rest.issues.createComment({
    owner,
    repo,
    issue_number,
    body
  })
}

const mergePr = (octo, owner, repo, prNumber) => {
  return octo.rest.pulls.merge({
    owner,
    repo,
    pull_number: prNumber,
    merge_method: 'squash'
  })
}

const createPr = (octo, owner, repo, title, head, base, body) => {
  return octo.rest.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body
  })
}

const addReviewers = (octo, owner, repo, prNumber, reviewers) => {
  return octo.rest.pulls.requestReviewers({
    owner,
    repo,
    pull_number: prNumber,
    reviewers
  })
}

function getLabelColor(label) {
  if (label.includes('app/')) {
    return 'ac1d1c'
  } else if (label.includes('tenant/')) {
    return '234099'
  } else if (label.includes('env/')) {
    return '33810b'
  } else if (label.includes('cluster/')) {
    return 'f1c232'
  } else if (label.includes('sys_service/')) {
    return '0e8a16'
  } else {
    return '000000'
  }
}

const addLabels = async (octo, owner, repo, issue_number, labels) => {
  const repoLabels = await octo.rest.issues.listLabelsForRepo({
    owner,
    repo
  })

  const labelsToAdd = labels.filter(label => {
    return !repoLabels.data.some(repoLabel => repoLabel.name === label)
  })

  for (const label of labelsToAdd) {
    const color = getLabelColor(label)

    console.info(`Creating label ${label} with color ${color}`)

    await octo.rest.issues.createLabel({
      owner,
      repo,
      name: label,
      color: getLabelColor(label)
    })
  }

  return octo.rest.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels
  })
}

module.exports = {
  uploadToRepo,
  getCurrentCommit,
  createBranch,
  deleteBranch,
  createComment,
  mergePr,
  createPr,
  addLabels,
  addReviewers
}
