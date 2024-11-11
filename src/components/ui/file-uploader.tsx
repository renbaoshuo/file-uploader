"use client"

import * as React from "react"
import Image from "next/image"
import { Primitive } from "@radix-ui/react-primitive"
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
  isDragAccept?: boolean
  isDragReject?: boolean
  isFileDialogActive?: boolean
  disabled?: boolean
  triggerId?: string
  contentId?: string
  labelId?: string
  descriptionId?: string
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

interface FileUploaderDataState {
  isDragActive?: boolean
  isDragAccept?: boolean
  isDragReject?: boolean
  isFileDialogActive?: boolean
}

function useFileUploaderDataState({
  isDragActive,
  isDragAccept,
  isDragReject,
  isFileDialogActive,
}: FileUploaderDataState) {
  return React.useMemo(() => {
    if (isDragActive) return "drag-active"
    if (isDragAccept) return "drag-accept"
    if (isDragReject) return "drag-reject"
    if (isFileDialogActive) return "dialog-active"
    return undefined
  }, [isDragActive, isDragAccept, isDragReject, isFileDialogActive])
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
  extends React.ComponentPropsWithoutRef<typeof Primitive.div> {
  isDragActive?: boolean
  isDragAccept?: boolean
  isDragReject?: boolean
  isFileDialogActive?: boolean
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
    isDragAccept,
    isDragReject,
    isFileDialogActive,
    maxSize,
    maxFileCount,
    disabled,
    triggerId,
    contentId,
    labelId,
    descriptionId,
  } = useFileUploader()

  const dataState = useFileUploaderDataState({
    isDragActive,
    isDragAccept,
    isDragReject,
    isFileDialogActive,
  })

  return (
    <Primitive.div
      {...getRootProps()}
      data-state={dataState}
      data-disabled={disabled ? "" : undefined}
      ref={ref}
      id={triggerId}
      aria-controls={contentId}
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center ring-offset-background transition hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[disabled]:pointer-events-none data-[state=drag-active]:border-muted-foreground/50 data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <input {...getInputProps()} aria-labelledby={labelId} />
      {isDragActive ? (
        <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
          <div className="rounded-full border border-dashed p-3">
            <Upload
              className="size-7 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p id={labelId} className="font-medium text-muted-foreground">
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
            <p id={labelId} className="font-medium text-muted-foreground">
              Drag {`'n'`} drop files here, or click to select files
            </p>
            <p id={descriptionId} className="text-sm text-muted-foreground/70">
              You can upload
              {maxFileCount && maxFileCount > 1
                ? ` ${maxFileCount === Infinity ? "multiple" : maxFileCount}
                  files (up to ${formatBytes(maxSize ?? 0)} each)`
                : ` a file with ${formatBytes(maxSize ?? 0)}`}
            </p>
          </div>
        </div>
      )}
    </Primitive.div>
  )
})
FileUploaderTrigger.displayName = "FileUploaderTrigger"

const FileUploader = React.forwardRef<HTMLDivElement, FileUploaderProps>(
  (
    {
      value,
      onValueChange,
      accept,
      multiple,
      maxFileCount,
      maxSize,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [files = [], setFiles] = useControllableState({
      defaultProp: [],
      prop: value,
      onChange: onValueChange,
    })

    const baseId = React.useId()
    const triggerId = `${baseId}-trigger`
    const contentId = `${baseId}-content`
    const labelId = `${baseId}-label`
    const descriptionId = `${baseId}-description`

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
        {({
          getRootProps,
          getInputProps,
          isDragActive,
          isDragAccept,
          isDragReject,
          isFileDialogActive,
        }) => (
          <FileUploaderContext.Provider
            value={{
              files,
              setFiles,
              removeFile,
              disabled,
              getRootProps,
              getInputProps,
              isDragActive,
              isDragAccept,
              isDragReject,
              isFileDialogActive,
              maxSize,
              maxFileCount,
              triggerId,
              contentId,
              labelId,
              descriptionId,
            }}
          >
            <Primitive.div
              ref={ref}
              className={cn("flex flex-col gap-6", className)}
              aria-disabled={disabled}
            >
              {children}
            </Primitive.div>
          </FileUploaderContext.Provider>
        )}
      </Dropzone>
    )
  }
)
FileUploader.displayName = "FileUploader"

const FileUploaderContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Primitive.div>
>(({ className, ...props }, ref) => {
  const {
    isDragActive,
    isDragAccept,
    isDragReject,
    isFileDialogActive,
    disabled,
  } = useFileUploader()

  const dataState = useFileUploaderDataState({
    isDragActive,
    isDragAccept,
    isDragReject,
    isFileDialogActive,
  })

  return (
    <Primitive.div
      ref={ref}
      data-state={dataState}
      data-disabled={disabled ? "" : undefined}
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
})
FileUploaderContent.displayName = "FileUploaderContent"

interface FileUploaderItemProps
  extends React.ComponentPropsWithoutRef<typeof Primitive.div> {
  value: FileWithPreview
}

const FileUploaderItem = React.forwardRef<
  HTMLDivElement,
  FileUploaderItemProps
>(({ className, value, ...props }, ref) => {
  return (
    <Primitive.div
      ref={ref}
      className={cn("relative flex items-center gap-2.5", className)}
      {...props}
    >
      <div className="flex flex-1 gap-2.5">
        <FileUploaderItemPreview value={value} />
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
      <FileUploaderItemRemove value={value} asChild>
        <Button type="button" variant="outline" size="icon" className="size-7">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Remove file</span>
        </Button>
      </FileUploaderItemRemove>
    </Primitive.div>
  )
})
FileUploaderItem.displayName = "FileUploaderItem"

interface FileUploaderItemPreviewProps
  extends React.ComponentPropsWithoutRef<typeof Primitive.div> {
  value: FileWithPreview
}

const FileUploaderItemPreview = React.forwardRef<
  HTMLDivElement,
  FileUploaderItemPreviewProps
>(({ className, value, ...props }, ref) => {
  if (value.preview && value.type.startsWith("image/")) {
    return (
      <Primitive.div ref={ref} className={cn("relative", className)} {...props}>
        <Image
          src={value.preview}
          alt={value.name}
          width={48}
          height={48}
          loading="lazy"
          className="aspect-square shrink-0 rounded-md object-cover"
        />
      </Primitive.div>
    )
  }

  return (
    <Primitive.div ref={ref} className={cn("relative", className)} {...props}>
      <FileText className="size-10 text-muted-foreground" aria-hidden="true" />
    </Primitive.div>
  )
})
FileUploaderItemPreview.displayName = "FileUploaderItemPreview"

interface FileUploaderItemProgressProps
  extends React.ComponentPropsWithoutRef<typeof Primitive.div> {
  value: number
}

const FileUploaderItemProgress = React.forwardRef<
  HTMLDivElement,
  FileUploaderItemProgressProps
>(({ className, value, ...props }, ref) => (
  <Primitive.div ref={ref} className={cn(className)} {...props}>
    <Progress value={value} />
  </Primitive.div>
))
FileUploaderItemProgress.displayName = "FileUploaderItemProgress"

interface FileUploaderItemRemoveProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof Primitive.button>,
    "value"
  > {
  value: FileWithPreview
}

const FileUploaderItemRemove = React.forwardRef<
  HTMLButtonElement,
  FileUploaderItemRemoveProps
>(({ value, className, ...props }, ref) => {
  const { removeFile, disabled } = useFileUploader()

  return (
    <Primitive.button
      ref={ref}
      type="button"
      className={cn(className)}
      onClick={() => removeFile(value)}
      disabled={disabled}
      {...props}
    />
  )
})
FileUploaderItemRemove.displayName = "FileUploaderItemRemove"

export {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileUploaderItemPreview,
  FileUploaderItemProgress,
  FileUploaderItemRemove,
  FileUploaderTrigger,
  type FileWithPreview,
}
