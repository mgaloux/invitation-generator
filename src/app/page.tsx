"use client";

import { useState, useEffect, ChangeEvent, KeyboardEvent, useRef } from "react";
import { ChevronsRight, Plus, Rocket, Upload, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { debounce, set } from "lodash";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const fonts = [{ name: "Monument Grotesk", className: "grotesk-medium" }];

const Home: React.FC = () => {
  const [templateImage, setTemplateImage] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string>(
    "/templates/CCW02 NIGHT PARTY.png",
  );
  const [resultPreview, setResultPreview] = useState<string>(
    "/templates/CCW02 NIGHT PARTY.png",
  );
  const [newGuest, setNewGuest] = useState<string>("");
  const [guests, setGuests] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState<number>(42);
  const [fontColor, setFontColor] = useState<string>("#ffffff");
  const [fontFamily, setFontFamily] = useState<string>("Monument Grotesk");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isTemplateUploading, setIsTemplateUploading] =
    useState<boolean>(false);
  const [isGuestListUploading, setIsGuestListUploading] =
    useState<boolean>(false);
  const [letterSpacing, setLetterSpacing] = useState<number>(8);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handlePreviewGeneration = async () => {
    const formData = new FormData();
    formData.append("guestName", "GUEST");
    formData.append("fontSize", fontSize.toString());
    formData.append("color", fontColor);
    formData.append("letterSpacing", letterSpacing.toString());
    formData.append("fontFamily", "MonumentGroteskMedium");
    formData.append("templateImagePath", templatePreview);
    if (templateImage) formData.append("templateImage", templateImage);

    const response = await fetch("/api/preview", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResultPreview(data.imageUrl);
  };

  useEffect(() => {
    const debouncedGeneratePreview = debounce(async () => {
      setIsPreviewLoading(true);
      await handlePreviewGeneration();
      setIsPreviewLoading(false);
    }, 500);

    debouncedGeneratePreview();

    return () => {
      debouncedGeneratePreview.cancel();
    };
  }, [
    fontColor,
    fontFamily,
    fontSize,
    letterSpacing,
    templatePreview,
    templateImage,
  ]);

  useEffect(() => {
    console.log("isPreviewLoading", isPreviewLoading);
  }, [isPreviewLoading]);

  const handleGuestListUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setIsGuestListUploading(true);
    const acceptedFiles = event.target.files;

    if (!acceptedFiles) {
      setIsGuestListUploading(false);
      toast.error("No file detected", { dismissible: true });
      return;
    }
    if (acceptedFiles.length > 1) {
      setIsGuestListUploading(false);
      toast.error("Please only send one file", { dismissible: true });
      return;
    }

    const file = acceptedFiles[0];

    // If the file is less than 4MB, skip the compression step
    if (file.size / 1024 / 1024 > 4) {
      setIsGuestListUploading(false);
      toast.error("File over size limit (4MB)", { dismissible: true });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("csvFile", file);

      const response = await fetch("/api/parseGuests", {
        method: "POST",
        body: formData,
      });

      const newGuests = await response.json();
      setGuests((prevGuests) => [...prevGuests, ...newGuests.guests]);
    } catch (error) {
      toast.error("Error during csv import", { dismissible: true });
    }

    setIsGuestListUploading(false);
  };

  const handleTemplateUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setIsTemplateUploading(true);
    const acceptedFiles = event.target.files;

    if (!acceptedFiles) {
      setIsTemplateUploading(false);
      toast.error("No file detected", { dismissible: true });
      return;
    }
    if (acceptedFiles.length > 1) {
      setIsTemplateUploading(false);
      toast.error("Please only send one file", { dismissible: true });
      return;
    }

    const file = acceptedFiles[0];

    // If the file is less than 4MB, skip the compression step
    if (file.size / 1024 / 1024 < 4) {
      setTemplateImage(file);
      const fileURL = URL.createObjectURL(file);
      setTemplatePreview(fileURL);
      setIsTemplateUploading(false);
      return;
    }

    // For files larger than 4MB, apply compression
    const options = {
      maxSizeMB: 4,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setTemplateImage(compressedFile);
      const fileURL = URL.createObjectURL(compressedFile);
      setTemplatePreview(fileURL);
    } catch (error) {
      toast.error("Error during image compression", { dismissible: true });
    }

    setIsTemplateUploading(false);
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCSVButtonClick = () => {
    if (csvInputRef.current) {
      csvInputRef.current.click();
    }
  };

  const handleNewGuestChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewGuest(event.target.value);
  };

  const handleAddGuest = () => {
    if (guests.includes(newGuest)) {
      toast.error("Can't add same Guest");
      setNewGuest("");
      return;
    }

    setGuests([...guests, newGuest.toUpperCase()]);
    setNewGuest("");
  };

  const handleDeleteGuest = (deletedGuest: string) => {
    const newguests = guests.filter((Guest) => Guest !== deletedGuest);
    setGuests(newguests);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddGuest();
    }
  };

  const handleSubmit = async () => {
    if (!templatePreview || guests.length === 0) {
      toast.error(
        `Failed to generate invitations: ${!templatePreview ? "No template image " : ""} ${guests.length === 0 && "No guests"}`,
        { dismissible: true },
      );
      return;
    }

    setIsLoading(true);

    for (const guest of guests) {
      const formData = new FormData();
      if (templateImage) {
        formData.append("templateImage", templateImage as File);
      } else {
        formData.append("templateImagePath", templatePreview); // Adjust your backend to handle this
      }

      formData.append("guestName", guest);
      formData.append("font", fontFamily);
      formData.append("fontSize", fontSize.toString());
      formData.append("color", fontColor);
      formData.append("letterSpacing", letterSpacing.toString());

      const response = await fetch("/api/invite", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${guest}.png`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        toast.error(`Failed to generate invitation for ${guest}`);
        console.error("Failed to generate invitation:", guest);
      }
    }

    setIsLoading(false);
  };

  const handleFontChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(event.target.value);
  };

  return (
    <div className="my-4 mx-auto px-4 sm:w-[80vw] lg:w-[50vw]">
      <Toaster />
      <h1 className="text-2xl mb-4 font-bold">
        Balcony Event Invitation Generator
      </h1>
      <div className="flex flex-col gap-4">
        <div className="ml-2 flex flex-col">
          <Label className="font-bold">Select Template Image</Label>
          <Label className="text-xs font-normal text-muted-foreground">
            Until 4MB. PNG Only.
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Select
            defaultValue="/templates/CCW02 NIGHT PARTY.png"
            onValueChange={(e) => {
              setTemplatePreview(e);
              setTemplateImage(null);
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectGroup>
                <SelectItem value="/templates/CCW02 DAY POPUP.png">
                  CCW02 DAY POPUP
                </SelectItem>
                <SelectItem value="/templates/CCW02 NIGHT PARTY.png">
                  CCW02 NIGHT PARTY
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p>or</p>

          <div>
            <Button
              className="bg-black text-white hover:bg-blue-900"
              onClick={handleButtonClick}
            >
              {isTemplateUploading ? (
                <>Uploading file...</>
              ) : (
                <>
                  Upload <Upload size={16} className="ml-2" />
                </>
              )}{" "}
            </Button>
            <input
              type="file"
              onChange={handleTemplateUpload}
              className="hidden"
              ref={fileInputRef}
              accept="image/png" // Add any accepted file types
            />
          </div>
        </div>
        <div className="flex gap-2 items-center justify-start">
          <div className="flex flex-col items-center gap-2">
            <Label className="font-bold ml-2">Template</Label>

            <Image
              src={templatePreview}
              alt="Template Preview"
              height={100}
              width={200}
            />
          </div>
          <ChevronsRight size={32} className="text-black mx-auto" />
          <div className="flex flex-col items-center gap-2">
            <Label className="font-bold ml-2">Result preview</Label>

            {isPreviewLoading ? (
              <div className="h-[350px] w-[200px] bg-gray-100 border border-dashed border-gray-400 flex items-center">
                <p className="mx-auto">Generating...</p>
              </div>
            ) : (
              <Image
                src={resultPreview}
                alt="Template Preview"
                height={100}
                width={200}
              />
            )}
          </div>
        </div>

        <div className="ml-2 flex flex-col">
          <Label className="font-bold">Guests</Label>
          <Label className="text-xs font-normal text-muted-foreground">
            Tap enter or the + button to add.
          </Label>

          <div className="flex gap-2 mt-2 items-center">
            <Input
              id="new-Guest"
              onChange={handleNewGuestChange}
              onKeyDown={handleKeyDown}
              placeholder={"New Guest..."}
              className="text-muted-foreground w-64"
              value={newGuest}
            />
            <Button
              className="p-0 w-8 bg-black text-white hover:bg-blue-900"
              onClick={handleAddGuest}
            >
              <Plus size={16} />
            </Button>
            <p>or</p>
            <div>
              <Button
                className="bg-black text-white hover:bg-blue-900"
                onClick={handleCSVButtonClick}
              >
                {isGuestListUploading ? (
                  <>Uploading guest list...</>
                ) : (
                  <>
                    Import Guest List from CSV{" "}
                    <Upload size={16} className="ml-2" />
                  </>
                )}{" "}
              </Button>
              <input
                type="file"
                onChange={handleGuestListUpload}
                className="hidden"
                ref={csvInputRef}
                accept="text/csv" // Add any accepted file types
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 gap-y-3">
          {guests.map((Guest, index) => (
            <Button
              variant={"ghost"}
              key={Guest + index}
              className="p-0 h-4 group"
              onClick={() => handleDeleteGuest(Guest)}
            >
              <Badge className="m-0 bg-blue-100 text-muted-foreground">
                {Guest} <X size={12} className="group-hover:text-foreground" />
              </Badge>
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flew-row justify-between items-center">
              <Label htmlFor="fontFamily" className="font-bold">
                Font Family
              </Label>
              <select
                id="fontFamily"
                value={fontFamily}
                onChange={handleFontChange}
                className={
                  "border border-gray-300 rounded px-2 py-1 " + fontFamily
                }
              >
                {fonts.map((font) => (
                  <option
                    key={font.name}
                    value={font.className}
                    className={font.className}
                  >
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flew-row justify-between items-center">
              <Label htmlFor="fontSize" className="font-bold">
                Font Size
              </Label>
              <input
                type="number"
                id="fontSize"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                min="10"
                max="200"
                className="border border-gray-300 rounded px-2 py-1 w-32"
              />
            </div>
            <div className="flex flew-row justify-between items-center">
              <Label htmlFor="letterSpacing" className="font-bold">
                Letter Spacing
              </Label>
              <Input
                type="number"
                id="letterSpacing"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 w-32"
              />
            </div>
            <div className="flex flew-row justify-between items-center">
              <Label htmlFor="fontColor" className="font-bold">
                Font Color
              </Label>
              <Input
                type="color"
                id="fontColor"
                onChange={(e) => setFontColor(e.target.value)}
                className="text-muted-foreground w-32"
                value={fontColor}
              />
            </div>
          </div>
        </div>

        <Button
          className="bg-black text-white hover:bg-blue-900"
          onClick={handleSubmit}
        >
          {isLoading ? "Generating..." : "Start creation"}{" "}
          <Rocket size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Home;
