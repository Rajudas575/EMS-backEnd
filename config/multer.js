// import multer from "multer";

// const upload = multer({
//   storage: multer.memoryStorage(), //IMPORTANT
// });

// export default upload;


import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  if (!allowedTypes.includes(file.mimetype)) {
    cb(
      new Error("Only JPG, JPEG, and PNG images are allowed"),
      false
    );
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, //5 MB
  },
  fileFilter,
});

export default upload;
