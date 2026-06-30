const express = require("express");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const { uploadBuffer } = require("../config/cloudinary");
const upload = require("../middleware/upload");
const Registration = require("../models/Registration");

const router = express.Router();

const phoneRegex = /^(\+9715\d{8}|\d{10})$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const jerseySizes = new Set(["Small", "Medium", "Large", "XL", "XXL", "3XL", "4XL"]);
const sleeveOptions = new Set(["Full Sleeves", "Half Sleeves"]);
const availabilityOptions = new Set(["Available all matches", "Missing few matches"]);

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateRegistration(body, file) {
  const errors = {};
  const values = {
    firstName: asString(body.firstName),
    lastName: asString(body.lastName),
    mobile: asString(body.mobile),
    email: asString(body.email).toLowerCase(),
    whatsappNumber: asString(body.whatsappNumber),
    jerseyName: asString(body.jerseyName),
    jerseyNumber: asString(body.jerseyNumber),
    jerseySize: asString(body.jerseySize),
    preferredSleeves: asString(body.preferredSleeves),
    currentClub: asString(body.currentClub),
    availability: asString(body.availability),
    notAvailableOn: asArray(body.notAvailableOn),
    feeAgreement: body.feeAgreement === true || body.feeAgreement === "true",
  };

  if (!values.firstName || values.firstName.length > 80) errors.firstName = "First name is required";
  if (!values.lastName || values.lastName.length > 80) errors.lastName = "Last name is required";
  if (!phoneRegex.test(values.mobile)) errors.mobile = "Use 10 digits or UAE format +9715XXXXXXXX";
  if (!emailRegex.test(values.email) || values.email.length > 255) errors.email = "Enter a valid email address";
  if (!phoneRegex.test(values.whatsappNumber)) errors.whatsappNumber = "Use 10 digits or UAE format +9715XXXXXXXX";
  if (!values.jerseyName || values.jerseyName.length > 80) errors.jerseyName = "Name of jersey is required";
  if (!/^\d{1,3}$/.test(values.jerseyNumber)) errors.jerseyNumber = "Jersey number must be whole numbers only";
  if (!jerseySizes.has(values.jerseySize)) errors.jerseySize = "Select a jersey size";
  if (!sleeveOptions.has(values.preferredSleeves)) errors.preferredSleeves = "Select preferred sleeves";
  if (values.currentClub && values.currentClub.length > 120) {
    errors.currentClub = "Current club/team must be 120 characters or fewer";
  }
  if (!availabilityOptions.has(values.availability)) errors.availability = "Select availability";
  if (values.availability === "Missing few matches" && values.notAvailableOn.length === 0) {
    errors.notAvailableOn = "Select at least one match you are not available on";
  }
  if (!values.feeAgreement) errors.feeAgreement = "You must agree to the registration and match fees";
  if (!file) errors.photo = "Upload a clear headshot photo under 2 MB";

  return { errors, values };
}

function mapRegistration(registration) {
  return {
    id: registration.id,
    firstName: registration.firstName,
    lastName: registration.lastName,
    fullName: registration.fullName,
    email: registration.email,
    mobile: registration.mobile,
    whatsappNumber: registration.whatsappNumber,
    jerseyName: registration.jerseyName,
    jerseyNumber: registration.jerseyNumber,
    jerseySize: registration.jerseySize,
    preferredSleeves: registration.preferredSleeves,
    currentClub: registration.currentClub,
    availability: registration.availability,
    notAvailableOn: registration.notAvailableOn,
    feeAgreement: registration.feeAgreement,
    photoPath: registration.photoPath,
    photoUrl: registration.photoUrl,
    createdAt: registration.createdAt,
  };
}

router.get("/", async (_req, res, next) => {
  try {
    await connectDB();
    const registrations = await Registration.find().sort({ createdAt: -1 }).lean({ virtuals: true });

    res.json({
      ok: true,
      registrations: registrations.map((registration) => ({
        ...registration,
        id: registration._id.toString(),
        _id: undefined,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const { errors, values } = validateRegistration(req.body, req.file);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        ok: false,
        message: "Please fix the highlighted fields",
        errors,
      });
    }

    await connectDB();

    const uploadResult = await uploadBuffer(req.file.buffer, {
      public_id: `${Date.now()}-${values.firstName}-${values.lastName}`.replace(/[^a-z0-9-]/gi, "-"),
    });

    const photoUrl =
      uploadResult?.secure_url ||
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const photoPath = uploadResult?.public_id || photoUrl;

    const registration = await Registration.create({
      ...values,
      fullName: `${values.firstName} ${values.lastName}`,
      photoPath,
      photoUrl,
      photoStorage: uploadResult ? "cloudinary" : "mongodb",
      cloudinaryPublicId: uploadResult?.public_id || null,
    });

    return res.status(201).json({
      ok: true,
      message: "Registration submitted successfully.",
      registration: mapRegistration(registration),
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        ok: false,
        message: "Please fix the highlighted fields",
        errors: Object.fromEntries(
          Object.entries(error.errors).map(([key, value]) => [key, value.message]),
        ),
      });
    }

    return next(error);
  }
});

module.exports = router;
