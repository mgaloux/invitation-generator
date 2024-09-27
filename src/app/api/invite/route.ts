import { NextResponse } from "next/server";
import sharp from "sharp";
import { registerFont, createCanvas, CanvasRenderingContext2D } from "canvas";
import path from "path";
import fs from "fs";

// Cache font registration to avoid re-registering
let fontRegistered = false;

function registerCustomFont() {
  if (!fontRegistered) {
    registerFont(
      path.join(process.cwd(), "public/fonts/MonumentGroteskMedium.ttf"),
      {
        family: "Monument Grotesk", // Ensure this is the correct family name from the font file
      },
    );
    fontRegistered = true;
    console.log("Font registered: Monument Grotesk");
  }
}

// POST request handler
export async function POST(request: Request) {
  const formData = await request.formData();

  const guestName = formData.get("guestName") as string;
  const fontSize = formData.get("fontSize") as string;
  const color = formData.get("color") as string;
  const letterSpacing = formData.get("letterSpacing") as string;

  // Check if the template is provided as a file or a file path
  const imageFile = formData.get("templateImage") as File | null;
  const templateImagePath = formData.get("templateImagePath") as string | null;

  // Ensure at least one source of the image is available
  if (!imageFile && !templateImagePath) {
    return NextResponse.json(
      { error: "Missing image or image path" },
      { status: 400 },
    );
  }

  let imageBuffer: Buffer;

  // Handle image file upload
  if (imageFile) {
    imageBuffer = Buffer.from(await imageFile.arrayBuffer());
  } else if (templateImagePath) {
    // Handle image path from server (e.g., static files)
    const templateFullPath = path.join(
      process.cwd(),
      "public",
      templateImagePath,
    );

    // Check if the file exists before reading it
    if (!fs.existsSync(templateFullPath)) {
      return NextResponse.json(
        { error: "Template image not found" },
        { status: 404 },
      );
    }

    imageBuffer = fs.readFileSync(templateFullPath);
  }

  // Register the custom font before processing the image
  registerCustomFont();

  const guestImageBuffer = await addGuestNameToImage(
    imageBuffer!,
    guestName,
    parseInt(fontSize),
    color,
    parseInt(letterSpacing),
  );

  return new Response(guestImageBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${guestName}.png"`,
    },
  });
}

// Function to draw text with custom letter spacing
function drawTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number = 0,
) {
  let currentX = x;
  for (const char of text) {
    ctx.fillText(char, currentX, y);
    currentX += ctx.measureText(char).width + letterSpacing;
  }
}

// Function to add guest name to the image using canvas and sharp
async function addGuestNameToImage(
  imageBuffer: Buffer,
  guestName: string,
  fontSize: number,
  color: string,
  letterSpacing: number,
): Promise<Buffer> {
  const { width, height } = await sharp(imageBuffer).metadata();
  if (!width || !height) {
    console.log("Error: Image metadata not found");
    return imageBuffer;
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.font = `${fontSize}px "Monument Grotesk", Sans`; // Use the registered font with a fallback
  ctx.fillStyle = color;

  const textWidth =
    ctx.measureText(guestName).width + (guestName.length - 1) * letterSpacing;
  const xPosition = (width - textWidth) / 2;
  const yPosition = height / 2;

  drawTextWithLetterSpacing(
    ctx,
    guestName,
    xPosition,
    yPosition,
    letterSpacing,
  );

  const canvasBuffer = canvas.toBuffer("image/png");
  const image = sharp(imageBuffer);

  return await image
    .composite([{ input: canvasBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
