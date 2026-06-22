import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function test() {
    try {
        const result = await imagekit.upload({
            file: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            fileName: "test_pixel.png",
            folder: "/mechapef/test"
        });
        console.log("Upload Success:", result.url);
    } catch (e) {
        console.error("Upload Failed:", e.message);
    }
}
test();
