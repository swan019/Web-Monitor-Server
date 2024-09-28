const axios = require("axios");

const WebsiteSchema = require("./WebsiteSchema");

function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
    value
  );
}

const createWebsite = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({
      status: false,
      message: "Url required",
    });
    return;
  }
  const validUrl = validateUrl(url);
  if (!validUrl) {
    res.status(422).json({
      status: false,
      message: "Url is not valid",
    });
    return;
  }

  const user = req.user;

  const response = await axios.get(url).catch((err) => void err);
  if (!response || response.status !== 200) {
    res.status(422).json({
      status: false,
      message: "Website with url " + url + " is not active",
    });
    return;
  }

  const newWebsite = new WebsiteSchema({
    url,
    userId: user._id,
    isActive: true,
  });

  newWebsite
    .save()
    .then((web) => {
      res.status(201).json({
        status: true,
        message: "Website created",
        data: web,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        message: "Error creating website document",
        error: err,
      });
    });
};

const deleteWebsite = async (req, res) => {
  const id = req.params.webId;

  if (!id) {
    res.status(400).json({
      status: false,
      message: "Id required",
    });
    return;
  }

  WebsiteSchema.deleteOne({ _id: id })
    .then(() => {
      res.status(200).json({
        status: true,
        message: "Website delete successfully",
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        message: "Error deleting website",
        error: err,
      });
    });
};

const getAllWebsites = async (req, res) => {
  const result = await WebsiteSchema.find({ userId: req.user._id }).populate({
    path: "userId",
    select: ["name", "email"],
  });

  res.status(200).json({
    status: true,
    data: result,
  });
};

module.exports = {
  createWebsite,
  deleteWebsite,
  getAllWebsites,
};
