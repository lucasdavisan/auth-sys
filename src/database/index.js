// Realizando a conexão com o banco de dados.
const Sequelize = require('sequelize');
const sequelize = new Sequelize('db_auth', 'root', '', {
    host: "localhost",
    dialect: 'mysql',
    define: {
        timestamps: true,
    }
});

module.exports = sequelize;
