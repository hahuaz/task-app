const jsonwebtoken = require("jsonwebtoken");
const User = require("./../models/user");

const auth = async (req, res, next) => {
  try {
    const clientToken = req.header("Authorization").replace("Bearer ", "");
    /*token'i abuk subuk değiştirme. yoksa verify yaparken error verior böyle token olmaz olamaz diye */
    const decoded = await jsonwebtoken.verify(clientToken, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded._id, "tokens.token": clientToken });
    if (!user) {
      throw new Error();
    }
    req.token = clientToken;
    req.user = user; /* we are saving fetched user in req object then we don't have to fetch again */
    next();
  } catch (e) {
    res.status(400).send({ error: "not authenticated" });
  }
};

module.exports = auth;
