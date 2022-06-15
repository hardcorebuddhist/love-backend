const { Router } = require("express");
const auth = require("../auth/middleware");
const User = require("../models").user;
const Profile = require("../models").profile;
const Favorite = require("../models").favorite;

const router = new Router();

// ALL PROFILES

router.get("/", async (req, res, next) => {
  try {
    res.send(await Profile.findAll());
  } catch (e) {
    console.log(e);
    next(e);
  }
});

// PROFILE BY ID include LIKE (details page)

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (isNaN(parseInt(id))) {
    return res.status(400).send({ message: "Profile id is not a number" });
  }

  const profile = await Profile.findByPk(id, { model: User, as: "fav" });

  if (profile === null) {
    return res.status(404).send({ message: "Profile not found" });
  }

  res.status(200).send({ message: "ok", profile });
});

// POST NEW PROFILE

router.post("/", auth, async (req, res, next) => {
  try {
    const { name, age, gender, imageUrl, about, language, location, userId } =
      req.body;
    const user = req.user;

    if (!name || !age || !gender || !imageUrl || !about || !location) {
      res.status(400).send("missing parameters");
    }
    if (user) {
      const newProfile = await Profile.create({
        name,
        age,
        gender,
        imageUrl,
        about,
        language,
        location,
        userId: user.id,
      });
      res.send({ message: "Profile created", newProfileId: newProfile.id });
    } else {
      console.log(`User with this id: ${userId} doesn't exist`);
    }
  } catch (e) {
    next(e);
  }
});

// POST FAVORITE

router.post("/:id/favorite", auth, async (req, res) => {
  const profile = await Profile.findByPk(req.params.id, { include: Favorite });
  const user = req.user;

  if (profile === null) {
    return res.status(404).send({ message: "This profile does not exist" });
  }

  if (!profile.userId === req.userId) {
    return res
      .status(403)
      .send({ message: "You are not authorized to update this profile" });
  }

  const favorite = await Favorite.create({
    profileId: profile.id,
  });

  return res
    .status(201)
    .send({ message: "Profile is added to favorites", favorite });
});

module.exports = router;
