
export async function saveImage(base64Image: string, folder: string): Promise<string> {
    // Vercel serverless environments are read-only. 
    // For now, we will return the base64 string directly (Data URI) 
    // so it can be stored in the database. 
    // In production, you should use Vercel Blob, Cloudinary, or AWS S3.

    // Ensure it has the correct prefix for a Data URI if missing
    if (!base64Image.startsWith('data:image/')) {
        return `data:image/jpeg;base64,${base64Image}`;
    }

    return base64Image;
}
