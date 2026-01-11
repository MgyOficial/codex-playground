const bcrypt = require('bcryptjs');
const User = require('../models/user');

const register = async (req, res) => {
  try {
    const { nombre, email, rol, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'El email ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      nombre,
      email,
      rol,
      passwordHash,
    });

    return res.status(201).json({
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al registrar el usuario.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    return res.json({
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
};

module.exports = {
  register,
  login,
};
