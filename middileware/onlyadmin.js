export const onlyadmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      status: false,
      message: "Admin access only",
    });
  }
  next();
};
