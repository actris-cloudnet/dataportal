import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { Request, Response } from 'express'
import { File } from './entity/File'
import * as express from 'express'

const port = process.argv[2]

async function init() {
    const app = express()

    const conn = await createConnection()

    app.get('/file/:uuid', async (req: Request, res: Response) => {
        const repo = conn.getRepository(File)
        repo.findOneOrFail(req.params.uuid)
            .then(result => res.send(result))
            .catch(_ => res.sendStatus(404))
    })

    app.listen(port, () => console.log(`App listening on port ${port}!`))
}

init()