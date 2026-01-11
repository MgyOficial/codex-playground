const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    tipo: {
      type: String,
      enum: ['virtual', 'presencial'],
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);
