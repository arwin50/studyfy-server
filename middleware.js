export const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.json("not logged in");
  }
  next();
};
