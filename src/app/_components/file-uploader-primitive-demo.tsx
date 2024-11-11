"use client"

import * as React from "react"

import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileUploaderProgress,
  FileUploaderTrigger,
} from "@/components/ui/file-uploader"

export function FileUploaderPrimitiveDemo() {
  const [files, setFiles] = React.useState<File[]>([])
  const [progress, _] = React.useState<Record<string, number>>({})

  console.log({ files })

  return (
    <FileUploader
      value={files}
      onValueChange={setFiles}
      accept={{ "image/*": [] }}
      maxSize={1024 * 1024 * 2}
      maxFileCount={5}
    >
      <FileUploaderTrigger />
      <FileUploaderContent>
        {files.map((file) => (
          <FileUploaderItem key={file.name} value={file}>
            <FileUploaderProgress value={progress[file.name] ?? 0} />
          </FileUploaderItem>
        ))}
      </FileUploaderContent>
    </FileUploader>
  )
}
