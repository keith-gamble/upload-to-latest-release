import * as core from '@actions/core'
import * as fs from 'fs'
import * as github from '@actions/github'

/**
 * Uploads a file to the latest release
 * @param {string} name - The name of the file
 * @param {string} path - The path to the file
 * @param {string} contentType - The content type of the file
 * @param {string} token - The GitHub token
 */
export async function run(): Promise<void> {
  try {
    if (process.env.GITHUB_REPOSITORY === undefined) {
      throw new Error('GITHUB_REPOSITORY is not set')
    }

    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

    const token = core.getInput('token', {required: true})
    const octokit = github.getOctokit(token)

    const name = core.getInput('name', {required: true})
    const path = core.getInput('path', {required: true})
    const contentType = core.getInput('content-type', {required: true})

    // Get the id of the latest release
    const releases_response = await octokit.request(
      'GET /repos/{owner}/{repo}/releases',
      {
        owner,
        repo
      }
    )

    // Verify that we have at least one release
    if (releases_response.data.length === 0) {
      throw new Error('No releases found')
    }

    const upload_url = releases_response.data[0].upload_url
    const release_id = releases_response.data[0].id

    core.debug(
      `Uploading ${path} to ${name} on release ${release_id} as Content-Type '${contentType}'`
    )
    core.debug(`Upload URL: ${upload_url}`)

    const assets_response = await octokit.request(
      'GET /repos/{owner}/{repo}/releases/{release_id}/assets',
      {
        owner,
        repo,
        release_id
      }
    )

    const assets = assets_response.data
    for (const a of assets.filter(asset => asset)) {
      const {id: asset_id, name: asset_name} = a
      if (asset_name === name) {
        octokit.request(
          'DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}',
          {
            owner,
            repo,
            asset_id
          }
        )
      }
    }

    const headers = {
      'content-type': contentType,
      'content-length': fs.statSync(path).size
    }

    const file = fs.createReadStream(path)
    core.debug(`File size: ${headers['content-length']}`)

    const response = await octokit.request(
      'POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name}',
      {
        owner,
        repo,
        release_id,
        name,
        headers,
        file
      }
    )

    const browser_download_url = response.data.browser_download_url

    core.debug(`Download URL: ${browser_download_url}`)
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.stack) {
        const lines = error.stack.split('\n')
        const limitedStack = lines.slice(0, 10).join('\n')
        core.setFailed(`${error}\n${limitedStack}`)
      } else {
        core.setFailed(error.message)
      }
    } else {
      core.setFailed('Unknown error')
    }
  }
}

run()
