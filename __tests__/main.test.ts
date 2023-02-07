import { run } from '../src/main'
import * as github from "@actions/github";
import * as octokit from "@octokit/rest";
import * as process from 'process'
import {expect, jest, test} from '@jest/globals'

// A test that executes run() and verifies that it throws an error
test('test runs', async () => {
	process.env['GITHUB_REPOSITORY'] = "keith-gamble/upload-to-latest-release"
	process.env['INPUT_NAME'] = "test.txt"
	process.env['INPUT_PATH'] = "test.txt"
	process.env['INPUT_CONTENT-TYPE'] = "text/plain"
	process.env['INPUT_TOKEN'] = "123456789"
	

	const octokitStub = {
		...octokit,
		request: jest.fn((route, options) => {
			if (route === "GET /repos/{owner}/{repo}/releases") {
				return {
					data: [
						{
							upload_url: "https://fake.com/upload",
							id: 123456789
						}
					]
				}
			} else if (route === "GET /repos/{owner}/{repo}/releases/{release_id}/assets") {
				return {
					data: []
				}
			} else if (route === "POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}") {
				return {
					data: {
						browser_download_url: "https://fake.com/download"
					}
				}
			} else {
				throw new Error("Unexpected route: " + route);
			}
		})
	};

	// @ts-ignore
	github.getOctokit = jest.fn().mockReturnValue(octokitStub);
	
	await expect(run).not.toThrowError();
})