import multer from "multer";

export const fileValidation = {
    image: ["image/png", "image/jpeg", "image/webp"],
};

// Define a function to handle file uploads with custom validation
function fileUpload(customValidation = []) {
    // Configure the storage settings for multer
    const storage = multer.diskStorage({});
    // Define a file filter function to validate the uploaded file type
    function fileFilter(req, file, cb) {
        // Check if the uploaded file's MIME type is included in the customValidation array

        if (customValidation.includes(file.mimetype)) {
            cb(null, true); // Accept the file
        } else {
            cb("Invalid file type", false); // Reject the file
        }
    }
    // Initialize multer with the configured file filter and storage settings
    const upload = multer({ fileFilter, storage });
    
    return upload;
}

export default fileUpload;
