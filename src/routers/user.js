const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("./../models/user");
const auth = require("./../middleware/auth");
const { sendWelcomeEmail } = require("./../emails/account");

// congfig multer
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (file.originalname.endsWith(".jpg")) {
      cb(undefined, true);
    } else if (file.originalname.endsWith(".png")) {
      cb(undefined, true);
    } else {
      return cb(new Error("pls upload jpg or png"));
    }
  }
});

const userRouter = new express.Router();

userRouter.get("/me", auth, (req, res) => {
  res.send({ user: req.user });
});

userRouter.post("", async (req, res) => {
  try {
    const user = new User(req.body);
    const token = await user.generateAuthToken();

    user.tokens = user.tokens.concat({ token });
    await user.save();
    try {
      sendWelcomeEmail(user.email, user.name);
    } catch (e) {
      console.log(e.message);
    }
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

userRouter.patch("/me", auth, async (req, res) => {
  /* don't let user change their status to admin or don't let change sensetive data  */
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "age", "password"];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send({
      error: "invalid operation. you trying to change sensetive data"
    });
  }
  try {
    updates.forEach(update => (req.user[update] = req.body[update]));
    savedUser = await req.user.save();
    res.send(savedUser);
  } catch (e) {
    res.status(400).send(e);
  }
  // we don't use below code cause we can't run document middleware(ones that we created on schema) on queries
  // User.findByIdAndUpdate(req.params.id, filteredBody, {
  //   new: true /* it will update database with new(updated) document */,
  //   runValidators: true
  // })
  //   .then(document => {
  //     res.send(document);
  //   })
  //   .catch(err => {
  //     res.status(400).send(err);
  //   });
});

userRouter.delete("/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.status(200).send();
  } catch (e) {
    res.status(400).send(e);
  }
});

userRouter.post("/login", async (req, res) => {
  try {
    const aUser = await User.findByCredentials(req.body.email, req.body.password);
    const token = await aUser.generateAuthToken();
    aUser.tokens = aUser.tokens.concat({ token });
    await aUser.save();
    res.send({ user: aUser, token });
  } catch (e) {
    res.status(400).send({
      error: e.message
    });
  }
});

userRouter.post("/logout", auth, async (req, res) => {
  try {
    /* delete user token from tokens array so hacker can't use that token to make req later */
    // console.log(req.user.tokens); aşşağıda nasıl token.token oluyor görmen için önce bir tokens'a bak
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.status(200).send(`${req.user.name} logged out`);
  } catch (e) {
    res.status(400).send(e);
  }
});

userRouter.post(
  "/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    // req.user.avatar = req.file.buffer; /* req ile gelen file'e erişebiliyorum */
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 150, height: 150 })
      .jpeg()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send(req.user);
  },
  (err, req, res, next) => {
    res.status(400).send({ error: err.message }); /* this feature doesn't catch err if error occured in async so don't use it on other routes */
  }
);
userRouter.delete("/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  req.user.save();
  await res.status(200).send();
});
userRouter.get("/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.set("Content-Type", "image/jpg");
    /* this is header. express configure this with default:
    "Content-Type", "application/json". but we sending file(image) so we have to configure it manually*/
    res.send(user.avatar);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

module.exports = userRouter;
