import * as core from '@actions/core'
import * as fs from 'fs'
import {Octokit} from '@octokit/core'

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
		const octokit = new Octokit({auth: token})

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

		const release_id = releases_response.data[0].id

		core.debug(
			`Uploading ${path} to ${name} on release ${release_id} as Content-Type '${contentType}'`
		)

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
				core.debug(`Deleting existing asset ${asset_id}`)
				await octokit.request(
					'DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}',
					{
						asset_id,
						owner,
						repo
					}
				)
			}
		}

		// Read the binary data from a file
		const fileData = fs.readFileSync(path)

		const headers = {
			'Content-Type': contentType,
			'Content-Length': fileData.length
		}

		const upload_response = await octokit.request(
			'POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}',
			{
				owner,
				repo,
				release_id,
				data: fileData,
				headers,
				name,
				label: name
			}
		)

		const browser_download_url = upload_response.data.browser_download_url

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
