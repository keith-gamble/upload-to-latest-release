# Upload To Latest Release GitHub Action

<p align="center">
  <a href="https://github.com/marketplace/actions/upload-to-latest-release-action"><img alt="upload-to-latest-release-action status" src="https://github.com/marketplace/actions/upload-to-latest-release-action/workflows/build-test/badge.svg"></a>
</p>



This action uploads files to the latest release of a GitHub repository.

## Usage

```yaml
- name: Upload to Latest Release
  uses: keith-gamble/upload-to-latest-release@master
  with:
    name: 'MyReleaseAsset.zip'
    path: 'build/MyReleaseAsset.zip'
    token: ${{ secrets.GITHUB_TOKEN }}
    content-type: 'application/zip' # Optional, defaults to 'application/octet-stream'
```

## Inspiration

This repository was inspired by:

- [shopify/upload-to-release](https://github.com/Shopify/upload-to-release)
- [actions/typescript-action](https://github.com/actions/typescript-action)

