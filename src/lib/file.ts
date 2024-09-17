export function readFileAsDataURL(file: File): Promise<{ raw: Uint8Array; dataURL: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      resolve({
        raw: new Uint8Array(reader.result as ArrayBuffer),
        dataURL: e.target?.result as string
      })
    }
    reader.readAsDataURL(file)
  })
}

export function readFileAsBuffer(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      // Convert the ArrayBuffer to a Uint8Array
      const arrayBuffer = reader.result as ArrayBuffer
      const uint8Array = new Uint8Array(arrayBuffer)
      resolve(uint8Array)
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsArrayBuffer(file)
  })
}
