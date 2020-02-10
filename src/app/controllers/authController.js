const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');

const authConfig = require('../../config/auth');

const UserSchema = require('../models/user');

const router = express.Router();

function generateToken(params = {}){
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    });
}

// Cadastro de usuários no app.
router.post('/register', async (req, res) => {
    try {
        if(await UserSchema.findOne({ where: {cpf: req.body.cpf} }))
            return res.status(400).send({ error: 'User already exists!' });

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { 
            name: req.body.name, 
            surname: req.body.surname,
            date_birth: req.body.date_birth,
            cpf: req.body.cpf,
            genre: req.body.genre,
            email: req.body.email, 
            password: hashedPassword
        };

        // Inserindo usuário no BD.
        UserSchema.create({
            name: user.name, 
            surname: user.surname,
            date_birth: user.date_birth,
            cpf: user.cpf,
            genre: user.genre,
            email: user.email, 
            password: user.password
        });

        user.password = undefined;
        
        return res.send({
            user,
            token: generateToken({ id: user.id }),
        });
    } catch(error) {
        return res.status(400).send({ error: 'Registration failed!' });
    }
});

// Método de autenticação.
router.post('/authenticate', async (req, res) => {
    const { cpf } = req.body;

    const user = await UserSchema.findOne({ where: {cpf} });
    
    if(user == null)
        return res.status(400).send('Cannot find user.');
    
    try {
        if(!await bcrypt.compare(req.body.password, user.password))
            return res.status(400).send({ error: 'Not allowed' });
    } catch {
        res.status(500).send()
    }

    user.password = undefined;

    res.send({
        user, 
        token: generateToken({ id: user.id }),
    });
});

router.post('/forgot_password', async (req, res) => {
    const { email } = req.body;

    try{
        const user = await UserSchema.findOne({ where: {email} });

        if(user == null)
            return res.status(400).send('Cannot find user.');
        
        // Gerando token de autenticação.
        const token = crypto.randomBytes(20).toString('hex');

        // Tempo de expiração do token.
        const now = new Date();
        now.setHours(now.getHours() + 1);

        await UserSchema.update({ 
            passwordResetToken: token,
            passwordResetExpires: now, 
        },
            { where: { id: user.id } }
        );

        mailer.sendMail({
            to: email,
            from: 'emailto@no-reply.com.br',
            template: 'auth/forgot_password',
            context: { token },
        }, (err) => {
            if(err)
                return res.status(400).send({ error: 'Cannot send forgot password email.' });

            return res.send();
        });
    } catch (err) {
        res.status(400).send({ error: 'Error on forgot password, please try again.' });
    }
});

router.post('/reset_password', async (req, res) => {
    const { email, token } = req.body;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    try{
        const user = await UserSchema.findOne({ where: {email} });

        if(user == null)
        return res.status(400).send('Cannot find user.');

        if(token !== user.passwordResetToken)
            return res.status(400).send({ error: 'Token invalid' });

        const now = new Date();

        if(now > user.passwordResetExpires)
            return res.status(400).send({ error: 'Token expired, generate a new one.' })

        user.password = hashedPassword;

        await user.save(hashedPassword);

        res.send();
    } catch (err) {
        res.status(400).send({ error: 'Cannot reset password, try again.' });
    }
});

module.exports = app => app.use('/auth', router);