import { NextResponse } from "next/server";
import sharp from "sharp";
import { registerFont, createCanvas, CanvasRenderingContext2D } from "canvas";
import path from "path";

// Cache font registration to avoid re-registering
let fontRegistered = false;

function registerCustomFont() {
  if (!fontRegistered) {
    registerFont(path.join(process.cwd(), 'public/fonts/MonumentGroteskMedium.ttf'), {
      family: "MonumentGrotesk",
    });
    fontRegistered = true;
  }
}

// POST request handler
export async function POST(request: Request) {
  const formData = await request.formData();
  const imageFile = formData.get("templateImage") as File;
  const guestName = formData.get("guestName") as string;
  const font = formData.get("font") as string;
  const fontSize = formData.get("fontSize") as string;
  const color = formData.get("color") as string;
  const letterSpacing = formData.get("letterSpacing") as string;

  if (!imageFile || !guestName) {
    return NextResponse.json(
      { error: "Missing image or guest name" },
      { status: 400 }
    );
  }

  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

  const guestImageBuffer = await addGuestNameToImage(
    imageBuffer,
    guestName,
    font,
    parseInt(fontSize),
    color,
    parseInt(letterSpacing)
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
  letterSpacing: number = 0
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
  fontPath: string,
  fontSize: number,
  color: string,
  letterSpacing: number
): Promise<Buffer> {
  registerCustomFont();

  const { width, height } = await sharp(imageBuffer).metadata();
  if (!width || !height) {
    console.log("Error: Image metadata not found");
    return imageBuffer;
  }
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.font = `${fontSize}px MonumentGrotesk`;
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
    letterSpacing
  );

  const canvasBuffer = canvas.toBuffer("image/png");
  const image = sharp(imageBuffer);

  return await image
    .composite([{ input: canvasBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
