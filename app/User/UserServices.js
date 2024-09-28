const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = require("./UserSchema");

const secretKey = "My_SECRET_KEY";

const generateToken = (data, exp) => {
  if (!exp) exp = Date.now() / 1000 + 24 * 60 * 60;

  const token = jwt.sign(
    {
      exp,
      data,
    },
    secretKey
  );
  return token;
};

const decodeToken = (token) => {
  let data;
  try {
    data = jwt.verify(token, secretKey);
  } catch (_e) {
    console.log("Error verifying token");
  }

  return data;
};

const verifyEmail = (email) => {
  const pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

  return pattern.test(email);
};

const generateNewAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({
      status: false,
      message: `Refresh token required`,
    });
    return;
  }

  const user = await userSchema.findOne({
    "tokens.refreshToken.token": refreshToken,
  });
  if (!user) {
    res.status(422).json({
      status: false,
      message: "User not found",
    });
    return;
  }

  const aTokenExp = Date.now() / 1000 + 24 * 60 * 60;
  const aToken = generateToken(
    {
      email: user.email,
      name: user.name,
    },
    aTokenExp
  );

  user.tokens.accessToken = {
    token: aToken,
    expireAt: new Date(aTokenExp * 1000),
  };

  user
    .save()
    .then((user) => {
      res.status(201).json({
        status: true,
        message: "Access token created",
        data: user,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        message: "Error creating access token",
        error: err,
      });
    });
};

const signupUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({
      status: false,
      message: `All fields are required`,
    });
    return;
  }
  if (!verifyEmail(email)) {
    res.status(400).json({
      status: false,
      message: `Email is not valid`,
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const aTokenExp = Date.now() / 1000 + 24 * 60 * 60;
  const rTokenExp = Date.now() / 1000 + 20 * 24 * 60 * 60;
  const aToken = generateToken(
    {
      email,
      name,
    },
    aTokenExp
  );
  const rToken = generateToken(
    {
      email,
      name,
    },
    rTokenExp
  );

  const newUser = new userSchema({
    name,
    email,
    password: hashedPassword,
    tokens: {
      accessToken: {
        token: aToken,
        expireAt: new Date(aTokenExp * 1000),
      },
      refreshToken: {
        token: rToken,
        expireAt: new Date(rTokenExp * 1000),
      },
    },
  });

  newUser
    .save()
    .then((user) => {

      

      res.status(201).json({
        status: true,
        message: "User successfully created",
        data: user,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        message: "Error creating user",
        error: err,
      });
    });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      status: false,
      message: `All fields are required`,
    });
    return;
  }
  if (!verifyEmail(email)) {
    res.status(400).json({
      status: false,
      message: `Email is not valid`,
    });
    return;
  }

  const user = await userSchema.findOne({ email });
  if (!user) {
    res.status(422).json({
      status: false,
      message: `Email is not present in our database`,
    });
    return;
  }

  const dbPassword = user.password;
  const matched = await bcrypt.compare(password, dbPassword);

  if (!matched) {
    res.status(422).json({
      status: false,
      message: `Credentials does not match`,
    });
    return;
  }

  res.status(200).json({
    status: true,
    message: "Login successful",
    data: user,
  });
};

module.exports = {
  signupUser,
  loginUser,
  generateNewAccessToken,
};
