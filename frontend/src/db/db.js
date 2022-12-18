import { gzip } from 'pako'
export default class DBConnection 
{
    constructor(dbconnectionName='mysql', endpoint='http://localhost:5001/api/db')
    {
        this.dbconnectionName = dbconnectionName;
        this.endpoint = endpoint
    }

    async pull()
    {
        const url = `${this.endpoint}/${this.dbconnectionName}/pull`
        const response = await fetch(url, {
          method: 'GET', // or 'PUT'
        })
        return await response.json();
    }

    async push(jsonStr)
    {
        const url = `${this.endpoint}/${this.dbconnectionName}/push`
        const payload = gzip(JSON.stringify({ json: jsonStr }));
        const response = await fetch(url, {
          method: 'POST', // or 'PUT'
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
          },
          body: payload
        })
        return await response.json();
    }
}