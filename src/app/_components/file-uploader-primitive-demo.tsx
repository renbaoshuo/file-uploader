"use client"

import * as React from "react"

import { useUploadFile } from "@/hooks/use-upload-file"
import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileUploaderItemProgress,
  FileUploaderTrigger,
} from "@/components/ui/file-uploader"

export function FileUploaderPrimitiveDemo() {
  const [files, setFiles] = React.useState<File[]>([])
  const { onUpload, progresses, uploadedFiles, isUploading } = useUploadFile(
    "imageUploader",
    {
      defaultUploadedFiles: [],
    }
  )

  console.log({ files, uploadedFiles, progresses })

  return (
    <FileUploader
      value={files}
      onValueChange={setFiles}
      onUpload={onUpload}
      accept={{ "image/*": [] }}
      maxSize={1024 * 1024 * 2}
      maxFileCount={5}
      disabled={isUploading}
    >
      <FileUploaderTrigger />
      <FileUploaderContent>
        {files.map((file) => (
          <FileUploaderItem key={file.name} value={file}>
            <FileUploaderItemProgress value={progresses[file.name] ?? 0} />
          </FileUploaderItem>
        ))}
      </FileUploaderContent>
    </FileUploader>
  )
}
