const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add title for the review'],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, 'Please add some text'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [
      true,
      'Please add a rating between 1 and 10',
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  hotel: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Prevent user from sending more than one review per hotel
ReviewSchema.index({ hotel: 1, user: 1 }, { unique: true });

// Static method to get average rating and save
ReviewSchema.statics.getAverageRating = async function (
  hotelId
) {
  const obj = await this.aggregate([
    {
      $match: { hotel: hotelId },
    },
    {
      $group: {
        _id: '$hotel',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    await this.model('Hotel').findByIdAndUpdate(hotelId, {
      averageRating: obj[0].averageRating,
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.hotel);
});

// Call getAverageRating before remove
ReviewSchema.pre('remove', function () {
  this.constructor.getAverageRating(this.hotel);
});

module.exports = mongoose.model('Review', ReviewSchema);
