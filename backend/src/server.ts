import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { Request, Response } from 'express'
import { File } from './entity/File'
import * as express from 'express'

const port = parseInt(process.argv[2])
const connName: string = process.env.NODE_ENV == 'test' ? 'test' : 'default'

async function init() {
    const app = express()

    const conn = await createConnection(connName)

    if(process.env.NODE_ENV != 'production') {
        app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        })
    }

    app.get('/file/:uuid', async (req: Request, res: Response) => {
        const repo = conn.getRepository(File)
        repo.findOneOrFail(req.params.uuid, { relations: ['site']})
            .then(result => res.send(result))
            .catch(_ => res.sendStatus(404))
    })

    app.listen(port, () => console.log(`App listening on port ${port} with ${connName} connection!`))
}

init()