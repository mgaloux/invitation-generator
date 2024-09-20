"use client";

import { useState, ChangeEvent, KeyboardEvent } from "react";
import { Plus, Rocket, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DragAndDrop from "./DragAndDrop";
import Image from "next/image";
import imageCompression from 'browser-image-compression';

const fonts = [
  { name: "Monument Grotesk", className: "grotesk-medium" }
];

const Home: React.FC = () => {
  const [templateImage, setTemplateImage] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [newGuest, setNewGuest] = useState<string>("");
  const [guests, setGuests] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState<number>(42);
  const [fontColor, setFontColor] = useState<string>("white");
  const [fontFamily, setFontFamily] = useState<string>("Monument Grotesk");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [letterSpacing, setLetterSpacing] = useState<number>(8);

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

  const handleDrop = async (acceptedFiles: File[]) => {
    if (!acceptedFiles) {
      toast.error("No file detected");
      return;
    }
    if (acceptedFiles.length > 1) {
      toast.error("Please only send one file");
      return;
    }

    const options = {
      maxSizeMB: 4, // Set to 1MB
      maxWidthOrHeight: 1920, // Set to resize large images
      useWebWorker: true,
    };

    const file = await imageCompression(acceptedFiles[0], options);

    setTemplateImage(file);
    const fileURL = URL.createObjectURL(file);
    setTemplatePreview(fileURL);

    if (!file) {
      toast("Please upload a file");
      return;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('templateImage', templateImage as File);
    formData.append('guests', JSON.stringify(guests));
    formData.append('font', fontFamily);
    formData.append('fontSize', fontSize.toString() + "px");
    formData.append('color', fontColor);
    formData.append('letterSpacing', letterSpacing.toString() + "px");

    const response = await fetch('/api/invite', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      setIsLoading(false);
      const url = URL.createObjectURL(blob);

      // Trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invitations.zip';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      setIsLoading(false);
      toast.error(`Failed to generate invitations : ${!templateImage && "No template image "}${guests.length === 0 && "No guests"}`);
      console.error('Failed to generate invitations');
    }
  };

  const handleFontChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(event.target.value);
  };

  return (
    <div className="my-8 mx-auto sm:w-[80vw] lg:w-[50vw]">
      <Toaster />
      <h1 className="text-2xl mb-4 font-bold">
        Balcony Event Invitation Generator
      </h1>
      <div className="flex flex-col gap-4">
        <div className="ml-2 flex flex-col">
          <Label className="font-bold">Template Image</Label>
          <Label className="text-xs font-normal text-muted-foreground">
            Until 100Mo. PNG Only.
          </Label>
        </div>

        <DragAndDrop onDrop={handleDrop} />

        {templatePreview && (
          <Image src={templatePreview} alt="Template Preview" width={200} height={200} />
        )}

        <div className="ml-2 flex flex-col">
          <Label className="font-bold">Guests</Label>
          <Label className="text-xs font-normal text-muted-foreground">
            Tap enter or the + button to add.
          </Label>
        </div>

        <div className="flex gap-2">
          <Input
            id="new-Guest"
            onChange={handleNewGuestChange}
            onKeyDown={handleKeyDown}
            placeholder={"New Guest..."}
            className="text-muted-foreground"
            value={newGuest}
          />
          <Button
            disabled={guests.length > 4}
            className="p-0 w-8 bg-black text-white hover:bg-blue-900"
            onClick={handleAddGuest}
          >
            <Plus size={16} />
          </Button>
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
              <Label htmlFor="fontFamily" className="font-bold">Font Family</Label>
              <select
            id="fontFamily"
            value={fontFamily}
            onChange={handleFontChange}
            className={"border border-gray-300 rounded px-2 py-1 " + fontFamily}
          >
            {fonts.map((font) => (
              <option key={font.name} value={font.className} className={font.className}>
                {font.name}
              </option>
            ))}
          </select>
            </div>
            <div  className="flex flew-row justify-between items-center">
              <Label htmlFor="fontSize" className="font-bold">Font Size</Label>
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
            <Label htmlFor="letterSpacing" className="font-bold">Letter Spacing</Label>
            <Input
              type="number"
              id="letterSpacing"
              value={letterSpacing}
              onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 w-32"
            />
          </div>
            <div  className="flex flew-row justify-between items-center">
              <Label htmlFor="fontColor" className="font-bold">Font Color</Label>
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
          {isLoading ? "Generating..." : "Start creation"} <Rocket size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Home;
