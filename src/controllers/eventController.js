const Event = require('../models/event');

const createEvent = async (req, res) => {
  try {
    const { nombre, fecha, tipo, descripcion } = req.body;

    if (!nombre || !fecha || !tipo || !descripcion) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    const event = await Event.create({
      nombre,
      fecha,
      tipo,
      descripcion,
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear el evento.' });
  }
};

const listEvents = async (_req, res) => {
  try {
    const events = await Event.find().sort({ fecha: 1 });
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar los eventos.' });
  }
};

module.exports = {
  createEvent,
  listEvents,
};
