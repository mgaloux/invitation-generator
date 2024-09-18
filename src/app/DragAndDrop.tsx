import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileInput, Upload } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  onDrop: (acceptedFiles: File[]) => void;
}

const DragAndDrop: React.FC<Props> = ({ onDrop }) => {
  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      onDrop(acceptedFiles);
    },
    [onDrop],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAccepted,
    accept: {
      "image/png": [],
    },
    maxSize: 100 * 1024 * 1024, // 100 MB,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex items-center justify-center w-full h-48 p-6 border-2 border-dashed border-border rounded-lg transition-colors 
                  ${isDragActive ? "border-white-500 bg-blue-50 dark:bg-blue-900" : "bg-gray-50 dark:bg-gray-900"}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <>
          <p>Drop the files here...</p>
        </>
      ) : (
        <div className="flex flex-col justify-center items-center gap-2">
          <FileInput className="text-muted-foreground" />
          <Label className="text-sm font-normal text-muted-foreground">
            Drag & drop your files here, or
          </Label>
          <Button variant={"outline"}>
            Click to select files
            <Upload size={16} className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DragAndDrop;
