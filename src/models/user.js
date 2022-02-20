const mongoose = require("mongoose");
const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");
const Task = require("./task");

/* schema is second attribute that you pass in mongoose.model. or schema is model config */
const userSchema = new mongoose.Schema(
  {
    /* we define our filds */
    name: {
      type: String,
      required: true,
      minlength: 3
    },
    age: {
      type: Number,
      validate: function(v) {
        /* with new syntax you can remove colon: and function typing. it's normal function not arrow */
        if (v < 11) {
          throw new Error("age must be greater than 11");
        }
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate(v) {
        if (!validator.isEmail(v)) {
          throw new Error("invalid email");
        }
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      trim: true /* remove spaces before, after */,
      validate(v) {
        if (v.toLowerCase().includes("password")) {
          throw new Error("password can't contain 'password' word");
        }
      }
    },
    tokens: [
      /* user oluşturulduğunda veya login olduğunda yaratıp ona gönderdiğim tokeni kaydetmemin sebebi?,
    authentication aşamasında ben tokenin doğrulunun "YANISIRA" bu token database'imda var mı diye bakacağım
    eğer yoksa user logout yapmıştır(çünkü logout sırasında siliyorum tokeni) ve o token sonsuza kadar geçerli olamaz artık.
    böylece logout yapılmışsa hacker token'e sahip olsa bile authenticaton yapamaz.  
    */
      {
        token: {
          type: String,
          required: true
        }
      }
    ],
    avatar: {
      type: Buffer /* resmi binary şeklinde kaydedeceksin database'e */
    }
  },
  {
    /* you have to see this one an object on schema's second armgument */
    timestamps: true /* this will add 2 field to document. createdAt, updatedAt */
  }
);

userSchema.virtual("tasks", {
  localField: "_id",
  ref: "Task",
  foreignField: "owner"
});

/* you can set methods on Model by using statics. so you can use that method where you can acsess model
you can set methods on Document by using methods. so you can use that method where you have document
look documentaion for more details */
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("unable to login");
  }

  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) {
    throw new Error("unable to login");
  }
  return user;
};

userSchema.methods.generateAuthToken = async function() {
  const user = this; /* this refers to document that we use this method on */
  const token = await jsonwebtoken.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  return token;
};

/*toJSON special method that every time invoked when JSON.stringfy invoked.
remember express every time uses JSON.stringfy on what we are sending. res.send(json'a dönüşecek olan).
so when express call JSON.stringfy on data(what we are sending) it'll also call toJSon.
so below medhod will used everytime on data before sending*/
userSchema.methods.toJSON = function() {
  const user = this;
  const rawUserObj = user.toObject(); /* toObject mongoose method. it clears all document methods that you can use on document like user.Save()  */

  delete rawUserObj._id;
  delete rawUserObj.__v;
  delete rawUserObj.password;
  delete rawUserObj.tokens;
  delete rawUserObj.avatar;
  return rawUserObj;
};

/* this is document middleware so it can be only used 4(valide,save,remove,init) */
userSchema.pre("save", async function(next) {
  const user = this; /* this refers to document that we about to save(create).!!!don't use arrow func*/
  if (user.isModified("password")) {
    user.password = await bcryptjs.hash(user.password, 8);
  }

  next();
});
/* this is document middleware so it can be only used 4(valide,save,remove,init) */
userSchema.pre("remove", async function(next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
