import path from 'node:path'

/**
 * Resolves a custom-protocol request without allowing access outside the renderer bundle.
 * Extensionless paths are Vue Router history routes and must serve the SPA entry point.
 */
export function resolveProtocolFilePath(staticRoot, pathName) {
  const requestedFilePath = path.resolve(staticRoot, '.' + pathName)

  if (requestedFilePath !== staticRoot && !requestedFilePath.startsWith(staticRoot + path.sep)) {
    return null
  }

  return path.extname(requestedFilePath) ? requestedFilePath : path.join(staticRoot, 'index.html')
}
