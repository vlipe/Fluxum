// validators/users.validators.js
const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('name é obrigatório'),
  body('email').isEmail().withMessage('email inválido'),
  body('password').isLength({ min: 6 }).withMessage('password precisa ter no mínimo 6 caracteres')
];

const loginValidator = [
  body('email').isEmail().withMessage('email inválido'),
  body('password').notEmpty().withMessage('password é obrigatório')
];

const userUpdateValidator = [
  body('name').optional().trim().notEmpty().withMessage('name inválido'),
  body('email').optional().isEmail().withMessage('email inválido'),
  body('password').optional().isLength({ min: 6 }).withMessage('password min 6')
];

module.exports = { registerValidator, loginValidator, userUpdateValidator };
