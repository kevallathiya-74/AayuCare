/**
 * Schedule Model
 * Manages doctor availability and working hours
 */

const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/,
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

const scheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    timeSlots: [timeSlotSchema],
    breakTime: {
      startTime: {
        type: String,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      },
      endTime: {
        type: String,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      },
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
scheduleSchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

// Virtual for formatted display
scheduleSchema.virtual("displayDay").get(function () {
  return this.dayOfWeek.charAt(0).toUpperCase() + this.dayOfWeek.slice(1);
});

scheduleSchema.set("toJSON", { virtuals: true });
scheduleSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Schedule", scheduleSchema);
