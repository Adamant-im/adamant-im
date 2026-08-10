// @vitest-environment node

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const readAndroidFile = (relativePath: string) => {
  return readFile(new URL(`../../android/app/src/main/${relativePath}`, import.meta.url), 'utf8')
}

const excludedBackupDomains = ['root', 'file', 'database', 'sharedpref', 'external']

describe('Android data exposure contract', () => {
  it('keeps application storage out of cloud backups and device transfers', async () => {
    const [manifest, legacyRules, extractionRules] = await Promise.all([
      readAndroidFile('AndroidManifest.xml'),
      readAndroidFile('res/xml/backup_rules.xml'),
      readAndroidFile('res/xml/data_extraction_rules.xml')
    ])

    expect(manifest).toContain('android:allowBackup="false"')
    expect(manifest).toContain('android:fullBackupContent="@xml/backup_rules"')
    expect(manifest).toContain('android:dataExtractionRules="@xml/data_extraction_rules"')
    expect(extractionRules).toContain('<cloud-backup>')
    expect(extractionRules).toContain('<device-transfer>')

    for (const domain of excludedBackupDomains) {
      const exclusion = `<exclude domain="${domain}" path="." />`

      expect(legacyRules).toContain(exclusion)
      expect(extractionRules.split(exclusion)).toHaveLength(3)
    }

    expect(legacyRules).not.toContain('<include')
    expect(extractionRules).not.toContain('<include')
  })

  it('limits both FileProviders to their application-specific directories', async () => {
    const [cameraPaths, attachmentPaths] = await Promise.all([
      readAndroidFile('res/xml/file_paths.xml'),
      readAndroidFile('res/xml/file_opener_paths.xml')
    ])

    expect(cameraPaths).toContain('<external-files-path name="captured_images" path="Pictures/" />')
    expect(attachmentPaths).toContain(
      '<files-path name="downloaded_attachments" path="attachments/" />'
    )

    for (const providerPaths of [cameraPaths, attachmentPaths]) {
      expect(providerPaths).not.toContain('<external-path')
      expect(providerPaths).not.toContain('<cache-path')
      expect(providerPaths).not.toContain('<external-cache-path')
      expect(providerPaths).not.toContain('path="."')
    }
  })
})
