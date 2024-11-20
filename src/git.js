const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')

// https://gist.github.com/sondt2709/96b45f85d81a769d834a738b73d42a5c

const listFilesRecursive = (dir) => {
    const files = fs.readdirSync(dir)
    const filesPaths = files.map(file => path.join(dir, file))
    const directories = filesPaths.filter(file => fs.statSync(file).isDirectory())
    const filesInDirectories = directories.map(directory => listFilesRecursive(directory)).flat()
    const filesOnly = filesPaths.filter(file => !fs.statSync(file).isDirectory())
    return filesOnly.concat(filesInDirectories)
}

const uploadToRepo = async (octo, coursePath, org, repo, branch) => {
    // gets commit's AND its tree's SHA
    const currentCommit = await getCurrentCommit(octo, org, repo, branch)
    const filesPaths = listFilesRecursive(`${coursePath}`)
    const filesBlobs = await Promise.all(filesPaths.map(createBlobForFile(octo, org, repo)))
    const pathsForBlobs = filesPaths.map(fullPath => path.relative(coursePath, fullPath))
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
        ref: `heads/${branch}`,
    })
    const commitSha = refData.object.sha
    const { data: commitData } = await octo.rest.git.getCommit({
        owner: org,
        repo,
        commit_sha: commitSha,
    })
    return {
        commitSha,
        treeSha: commitData.tree.sha,
    }
}

// Notice that readFile's utf8 is typed differently from Github's utf-8
const getFileAsUTF8 = (filePath) => fs.readFile(filePath, 'utf8')

const createBlobForFile = (octo, org, repo) => async (filePath) => {
    const content = await getFileAsUTF8(filePath)
    const blobData = await octo.rest.git.createBlob({
        owner: org,
        repo,
        content,
        encoding: 'utf-8',
    })
    return blobData.data
}

const createNewTree = async (octo, owner, repo, blobs, paths, parentTreeSha) => {
    // My custom config. Could be taken as parameters
    const tree = blobs.map(({ sha }, index) => ({
        path: paths[index],
        mode: `100644`,
        type: `blob`,
        sha,
    }))
    const { data } = await octo.rest.git.createTree({
        owner,
        repo,
        tree,
        base_tree: parentTreeSha,
    })
    return data
}

const createNewCommit = async (octo, org, repo, message, currentTreeSha, currentCommitSha) =>
    (await octo.rest.git.createCommit({
        owner: org,
        repo,
        message,
        tree: currentTreeSha,
        parents: [currentCommitSha],
    })).data

const setBranchToCommit = (octo, org, repo, branch, commitSha) =>
    octo.rest.git.updateRef({
        owner: org,
        repo,
        ref: `heads/${branch}`,
        sha: commitSha,
    })


const createBranch = (octo, owner, repo, ref, sha) => {
    return octo.rest.git.createRef({
        owner,
        repo,
        ref,
        sha,
    });
}

const createComment = (octo, owner, repo, issue_number, body) => {
    return octo.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body
    });
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
module.exports = {
    uploadToRepo,
    getCurrentCommit,
    createBranch,
    createComment,
    mergePr,
    createPr
}
