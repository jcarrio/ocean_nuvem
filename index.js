require("dotenv").config();

const { MongoClient, ObjectId } = require("mongodb");
const express = require("express");
const app = express();

const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbHost = process.env.DB_HOST;

(async () => {
    // const url = "mongodb://localhost:27017";
    const url = `mongodb+srv://${dbUser}:${dbPass}@${dbHost}/`;
    const dbName = process.env.DB_NAME;

    const client = await MongoClient.connect(url);

    const db = client.db(dbName);

    const collection = db.collection("personagens");

    // Sinalizamos para o Express que todo body da requisição
    // estará estruturado em JSON
    app.use(express.json());
    app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

    app.get("/", function (req, res) {
        //res.send("Hello World");
        res.redirect('api-docs');
    });

    // CRUD -> Create, Read (All & Single/byId), Update, Delete

    // [GET] /personagens
    // Read All
    app.get("/personagens", async function (req, res) {
        const listaPersonagens = await collection.find().toArray();
        res.send(listaPersonagens);
    });

    function findById(id) {
        return collection.findOne({ _id: ObjectId(id) });
    }

    // [GET] /personagens/:id
    // Read By Id
    app.get("/personagens/:id", async function (req, res) {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            res.status(401).send("Id inválido.");

            return;
        }

        const item = await findById(id);

        if (!item) {
            res.status(404).send("Personagem não encontrado.");

            return;
        }

        res.send(item);
    });

    // [POST] /personagens
    // Create
    app.post("/personagens", async function (req, res) {
        // Obtém o corpo da requisição e coloca na variável item
        const item = req.body;

        //console.log(item);
        if (!item || !item.nome) {
            res.status(400).send(
                "Chave 'nome' não foi encontrada no corpo da requisição."
            );

            return;
        }

        await collection.insertOne(item);

        res.status(201).send(item);
    });

    // [PUT] /personagens/:id
    // Update
    app.put("/personagens/:id", async function (req, res) {
        /*
        Objetivo: Atualizar uma personagem
        Passos:
        - Pegar o ID dessa personagem
        - Pegar a nova informação que eu quero atualizar
        - Atualizar essa nova informação na lista de personagens
        - Exibir que deu certo
        */

        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            res.status(401).send("Id inválido.");

            return;
        }

        const itemEncontrado = await findById(id);

        if (!itemEncontrado) {
            res.status(404).send("Personagem não encontrado.");

            return;
        }

        const novoItem = req.body;

        if (!novoItem || !novoItem.nome) {
            res.status(400).send(
                "Chave 'nome' não foi encontrada no corpo da requisição."
            );

            return;
        }

        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: novoItem }
        );

        res.send(novoItem);
    });

    // [DELETE] /personagens/:id
    // Delete
    app.delete("/personagens/:id", async function (req, res) {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            res.status(401).send("Id inválido.");

            return;
        }

        const itemEncontrado = await findById(id);

        if (!itemEncontrado) {
            res.status(404).send("Personagem não encontrado.");

            return;
        }

        await collection.deleteOne({ _id: new ObjectId(id) });

        res.send("Personagem removido com sucesso!");
    });

    //app.listen(3000);
    app.listen(process.env.PORT || 3000);
})();
