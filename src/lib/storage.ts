import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function saveImage(base64Image: string, folder: string): Promise<string> {
    try {
        // Ensure it has the correct prefix for Cloudinary if missing
        let formattedImage = base64Image;
        if (!base64Image.startsWith('data:image/')) {
            formattedImage = `data:image/jpeg;base64,${base64Image}`;
        }

        const uploadResponse = await cloudinary.uploader.upload(formattedImage, {
            folder: `swiftpay/${folder}`,
            resource_type: 'image',
        });

        return uploadResponse.secure_url;
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
}

export async function deleteImage(url: string): Promise<void> {
    try {
        // Extract public ID from URL
        // Example: https://res.cloudinary.com/cloud-name/image/upload/v12345/swiftpay/kyc/front/abcdefg.jpg
        const parts = url.split('/');
        const fileNameWithExt = parts[parts.length - 1];
        const publicId = fileNameWithExt.split('.')[0];

        // Reconstruct full public ID with folder
        // This is a bit naive but works if we know the folder structure
        // Better: store publicId in database
        const folderIndex = parts.indexOf('swiftpay');
        if (folderIndex !== -1) {
            const fullPublicId = parts.slice(folderIndex).join('/').split('.')[0];
            await cloudinary.uploader.destroy(fullPublicId);
        }
    } catch (error: any) {
        console.error('Cloudinary delete error:', error);
    }
}
