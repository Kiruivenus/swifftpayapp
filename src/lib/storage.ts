import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function saveImage(base64Image: string, folder: string): Promise<string> {
    // Remove data:image/jpeg;base64, prefix if exists
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `${crypto.randomUUID()}.jpg`;
    const publicDir = path.join(process.cwd(), 'public');
    const uploadDir = path.join(publicDir, 'uploads', folder);

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Return the public URL
    return `/uploads/${folder}/${fileName}`;
}
