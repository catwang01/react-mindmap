import axios from 'axios';

export class JupyterClient 
{
    constructor(base_url) {
        this.base_url = base_url;
    }
    async createNote(path)
    {
        const encoded = encodeURIComponent(path + '.ipynb')
        const url = `${this.base_url}/api/contents/${encoded}`;
        // Send a GET request (default method)
        const response = await axios({ 
            method: 'put',
            url: url,
            data: {
                type: 'notebook'
            }
        });
        return (response.status == 200);
    }
}