"use client";
import { uploadToS3 } from "@/lib/s3";
import { Inbox } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";

const FileUpload = () => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: (acceptedFile) => onDropHandler(acceptedFile),
  });

  const onDropHandler = async (acceptedFile: File[]) => {
    console.log(acceptedFile);
    const file = acceptedFile[0];

    if (isBiggerThan10mb(file)) {
      alert("please upload smaller files");
      return;
    }

    try {
      const data = await uploadToS3(file);
      console.log("data", data);
    } catch (error) {
      console.log(error);
    }
  };

  const isBiggerThan10mb = (file: File) => {
    return file.size > 10 * 1024 * 1024;
  };

  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        <>
          <Inbox className="w-10 h-10 text-blue-500" />
          <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
        </>
      </div>
    </div>
  );
};

export default FileUpload;
