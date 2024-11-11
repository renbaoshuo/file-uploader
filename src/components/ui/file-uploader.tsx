"use client"

import * as React from "react"
import Image from "next/image"
import { FileText, Upload, X } from "lucide-react"
import Dropzone, {
  type DropzoneInputProps,
  type DropzoneProps,
  type DropzoneRootProps,
  type FileRejection,
} from "react-dropzone"
import { toast } from "sonner"

import { cn, formatBytes } from "@/lib/utils"
import { useControllableState } from "@/hooks/use-controllable-state"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface FileWithPreview extends File {
  preview?: string
}

interface FileUploaderContextValue {
  files: FileWithPreview[]
  setFiles: (files: FileWithPreview[]) => void
  removeFile: (fileToRemove: FileWithPreview) => void
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T
  maxSize?: number
  maxFileCount?: number
  isDragActive?: boolean
  disabled?: boolean
}

const FileUploaderContext = React.createContext<
  FileUploaderContextValue | undefined
>(undefined)

function useFileUploader() {
  const context = React.useContext(FileUploaderContext)
  if (!context) {
    throw new Error("useFileUploader must be used within a FileUploader")
  }
  return context
}

interface FileUploaderProps
  extends Omit<DropzoneProps, "maxFiles" | "children"> {
  value?: FileWithPreview[]
  onValueChange?: (files: FileWithPreview[]) => void
  maxFileCount?: number
  children?: React.ReactNode
  className?: string
  disabled?: boolean
}

interface FileUploaderTriggerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isDragActive?: boolean
  maxSize?: number
  maxFileCount?: number
  disabled?: boolean
}

const FileUploaderTrigger = React.forwardRef<
  HTMLDivElement,
  FileUploaderTriggerProps
>(({ className, ...props }, ref) => {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    maxSize,
    maxFileCount,
    disabled,
  } = useFileUploader()

  return (
    <div
      {...getRootProps()}
      ref={ref}
      className={cn(
        "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25",
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragActive && "border-muted-foreground/50",
        disabled && "pointer-events-none opacity-60",
        className
      )}
      {...props}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
          <div className="rounded-full border border-dashed p-3">
            <Upload
              className="size-7 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p className="font-medium text-muted-foreground">
            Drop the files here
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
          <div className="rounded-full border border-dashed p-3">
            <Upload
              className="size-7 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col gap-px">
            <p className="font-medium text-muted-foreground">
              Drag {`'n'`} drop files here, or click to select files
            </p>
            <p className="text-sm text-muted-foreground/70">
              You can upload
              {maxFileCount && maxFileCount > 1
                ? ` ${maxFileCount === Infinity ? "multiple" : maxFileCount}
                  files (up to ${formatBytes(maxSize ?? 0)} each)`
                : ` a file with ${formatBytes(maxSize ?? 0)}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
})
FileUploaderTrigger.displayName = "FileUploaderTrigger"

const FileUploader = React.forwardRef<HTMLDivElement, FileUploaderProps>(
  (
    {
      className,
      value,
      onValueChange,
      accept,
      multiple,
      maxFileCount,
      maxSize,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const [files = [], setFiles] = useControllableState({
      defaultProp: [],
      prop: value,
      onChange: onValueChange,
    })

    const removeFile = React.useCallback(
      (fileToRemove: FileWithPreview) => {
        setFiles(files.filter((file) => file !== fileToRemove))
      },
      [files, setFiles]
    )

    const onDrop = React.useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        const newFiles = acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )

        setFiles(files ? [...files, ...newFiles] : newFiles)

        if (rejectedFiles.length > 0) {
          rejectedFiles.forEach(({ file }) => {
            toast.error(`File ${file.name} was rejected`)
          })
        }
      },
      [files, setFiles]
    )

    React.useEffect(() => {
      return () => {
        files.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview)
          }
        })
      }
    }, [files])

    return (
      <Dropzone
        {...props}
        onDrop={onDrop}
        accept={accept}
        maxSize={maxSize}
        maxFiles={maxFileCount}
        multiple={maxFileCount ? maxFileCount > 1 : multiple}
        disabled={disabled}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <FileUploaderContext.Provider
            value={{
              files,
              setFiles,
              removeFile,
              disabled,
              getRootProps,
              getInputProps,
              isDragActive,
              maxSize,
              maxFileCount,
            }}
          >
            <div ref={ref} className="flex flex-col gap-6">
              {children}
            </div>
          </FileUploaderContext.Provider>
        )}
      </Dropzone>
    )
  }
)
FileUploader.displayName = "FileUploader"

interface FileUploaderContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isDragActive?: boolean
}

const FileUploaderContent = React.forwardRef<
  HTMLDivElement,
  FileUploaderContentProps
>(({ className, isDragActive, ...props }, ref) => {
  const { disabled } = useFileUploader()

  return (
    <div
      ref={ref}
      data-drag-active={isDragActive ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
})
FileUploaderContent.displayName = "FileUploaderContent"

interface FileUploaderItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: FileWithPreview
  showRemoveButton?: boolean
}

const FileUploaderItem = React.forwardRef<
  HTMLDivElement,
  FileUploaderItemProps
>(({ className, value, showRemoveButton = true, ...props }, ref) => {
  const { removeFile, disabled } = useFileUploader()

  return (
    <div
      ref={ref}
      className={cn("relative flex items-center gap-2.5", className)}
      {...props}
    >
      <div className="flex flex-1 gap-2.5">
        <FileUploaderPreview value={value} />
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-px">
            <p className="line-clamp-1 text-sm font-medium text-foreground/80">
              {value.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(value.size)}
            </p>
          </div>
        </div>
      </div>
      {showRemoveButton && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={() => removeFile(value)}
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Remove file</span>
        </Button>
      )}
    </div>
  )
})
FileUploaderItem.displayName = "FileUploaderItem"

interface FileUploaderPreviewProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: FileWithPreview
}

const FileUploaderPreview = React.forwardRef<
  HTMLDivElement,
  FileUploaderPreviewProps
>(({ className, value, ...props }, ref) => {
  if (value.preview && value.type.startsWith("image/")) {
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <Image
          src={value.preview}
          alt={value.name}
          width={48}
          height={48}
          loading="lazy"
          className="aspect-square shrink-0 rounded-md object-cover"
        />
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("relative", className)} {...props}>
      <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
    </div>
  )
})
FileUploaderPreview.displayName = "FileUploaderPreview"

interface FileUploaderProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: number
}

const FileUploaderProgress = React.forwardRef<
  HTMLDivElement,
  FileUploaderProgressProps
>(({ className, value, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props}>
    <Progress value={value} />
  </div>
))
FileUploaderProgress.displayName = "FileUploaderProgress"

export {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileUploaderPreview,
  FileUploaderProgress,
  FileUploaderTrigger,
  type FileWithPreview,
}
