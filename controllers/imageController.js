const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const uploadUserImage = async (req, res) => {
    if (!req.files) {
        throw new CustomError.BadRequestError("No File Uploaded");
    }
    const userImage = req.files.image;
    if (!userImage.mimetype.startsWith("image")) {
        fs.unlinkSync(req.files.image.tempFilePath);
        throw new CustomError.BadRequestError("Please upload Image");
    }
    const maxSize = 1024 * 1024;
    if (userImage.size > maxSize) {
        fs.unlinkSync(req.files.image.tempFilePath);
        throw new CustomError.BadRequestError(
            "Please upload image smaller than 1MB"
        );
    }
    const result = await cloudinary.uploader.upload(
        req.files.image.tempFilePath,
        {
            use_filename: true,
            folder: "file-upload",
        }
    );

    fs.unlinkSync(req.files.image.tempFilePath);
    return res
        .status(StatusCodes.OK)
        .json({ image: { src: result.secure_url } });
};

module.exports = {
    uploadUserImage,
};
