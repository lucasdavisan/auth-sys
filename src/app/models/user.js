const Sequelize = require('sequelize');
const sequelize = require('../../database/index');

const UserSchema = sequelize.define('usuarios', {
    name: {
        type: Sequelize.STRING,
        required: true,
    },
    surname: {
        type: Sequelize.STRING,
        required: true,
    },
    genre: {
        type: Sequelize.STRING,
        required: true,
    },
    cpf: {
        type: Sequelize.STRING,
        unique: true,
        required: true,
    },
    password: {
        type: Sequelize.STRING,
        required: true,
        select: false,
    },
    email: {
        type: Sequelize.STRING,
        required: true,
        lowercase: true,
    },
    date_birth: {
        type: Sequelize.DATEONLY,
    },
    passwordResetToken: {
        type: Sequelize.STRING,
        select: false,
    },
    passwordResetExpires: {
        type: Sequelize.DATE,
        select: false,
    },
});

module.exports = UserSchema;

// UserSchema.sync({ force: true });