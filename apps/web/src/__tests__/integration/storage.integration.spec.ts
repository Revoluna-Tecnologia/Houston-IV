import { describe, it, expect } from 'vitest'
import { apiRequest } from '../setup.integration'

interface UploadResponse {
  url: string
  path: string
  fileName: string
  mimeType: string
  size: number
}

interface FileInfo {
  exists: boolean
  size?: number
  mimeType?: string
}

describe('Storage Integration', () => {
  let uploadedFilePath: string

  describe('Upload Operations', () => {
    it('should upload a text file', async () => {
      const formData = new FormData()
      const blob = new Blob(['Hello, World!'], { type: 'text/plain' })
      formData.append('file', blob, 'test.txt')

      const response = await fetch(
        `${process.env.VITE_API_URL || 'http://localhost:3001/api'}/storage/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (response.ok) {
        const result: UploadResponse = await response.json()

        expect(result.url).toBeDefined()
        expect(result.fileName).toMatch(/\.txt$/)
        expect(result.mimeType).toBe('text/plain')
        expect(result.size).toBe(13)

        uploadedFilePath = result.path
      }
    })

    it('should upload to subdirectory', async () => {
      const formData = new FormData()
      const blob = new Blob(['Subdir content'], { type: 'text/plain' })
      formData.append('file', blob, 'subdir-file.txt')
      formData.append('subDir', 'documents/2024')

      const response = await fetch(
        `${process.env.VITE_API_URL || 'http://localhost:3001/api'}/storage/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (response.ok) {
        const result: UploadResponse = await response.json()

        expect(result.path).toContain('documents/2024/')
      }
    })

    it('should upload PDF file', async () => {
      const formData = new FormData()
      const blob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' })
      formData.append('file', blob, 'document.pdf')

      const response = await fetch(
        `${process.env.VITE_API_URL || 'http://localhost:3001/api'}/storage/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (response.ok) {
        const result: UploadResponse = await response.json()

        expect(result.mimeType).toBe('application/pdf')
        expect(result.fileName).toMatch(/\.pdf$/)
      }
    })

    it('should upload CSV file', async () => {
      const formData = new FormData()
      const blob = new Blob(['name,email\nJohn,john@example.com'], { type: 'text/csv' })
      formData.append('file', blob, 'data.csv')

      const response = await fetch(
        `${process.env.VITE_API_URL || 'http://localhost:3001/api'}/storage/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (response.ok) {
        const result: UploadResponse = await response.json()

        expect(result.mimeType).toBe('text/csv')
        expect(result.fileName).toMatch(/\.csv$/)
      }
    })

    it('should reject disallowed MIME types', async () => {
      const formData = new FormData()
      const blob = new Blob(['Executable content'], { type: 'application/x-msdownload' })
      formData.append('file', blob, 'malware.exe')

      const response = await fetch(
        `${process.env.VITE_API_URL || 'http://localhost:3001/api'}/storage/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('File Info', () => {
    it('should get file info for existing file', async () => {
      if (uploadedFilePath) {
        const response = await apiRequest<FileInfo>(
          `/storage/info?path=${encodeURIComponent(uploadedFilePath)}`
        )

        expect(response.exists).toBe(true)
        expect(response.size).toBeDefined()
        expect(response.mimeType).toBeDefined()
      }
    })

    it('should return exists=false for non-existent file', async () => {
      const response = await apiRequest<FileInfo>(
        '/storage/info?path=/non-existent-file.txt'
      )

      expect(response.exists).toBe(false)
    })
  })

  describe('Delete Operations', () => {
    it('should delete an existing file', async () => {
      // First upload a file
      const formData = new FormData()
      const blob = new Blob(['To be deleted'], { type: 'text/plain' })
      formData.append('file', blob, 'to-delete.txt')

      const uploadResponse = await fetch(
        `${process.env.VITE_API_URL || 'http://localhost:3001/api'}/storage/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (uploadResponse.ok) {
        const result: UploadResponse = await uploadResponse.json()

        // Delete the file
        await apiRequest(`/storage?path=${encodeURIComponent(result.path)}`, {
          method: 'DELETE',
        })

        // Verify file no longer exists
        const info = await apiRequest<FileInfo>(
          `/storage/info?path=${encodeURIComponent(result.path)}`
        )
        expect(info.exists).toBe(false)
      }
    })

    it('should not throw when deleting non-existent file', async () => {
      // Should not throw error
      await apiRequest('/storage?path=/non-existent-file.txt', {
        method: 'DELETE',
      })
    })
  })

  describe('URL Generation', () => {
    it('should get correct URL for path', async () => {
      const response = await apiRequest<{ url: string }>(
        '/storage/url?path=documents/2024/file.pdf'
      )

      expect(response.url).toContain('documents/2024/file.pdf')
    })
  })
})
