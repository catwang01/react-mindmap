import axios from 'axios';
import { ensureSuffix } from "../../utils/stringUtils";
import { log } from './logger';
import { trimWordStart, trimWordEnd } from '../../utils/stringUtils';

export class NotFoundError extends Error {
}

export interface JupyterNote {
    endpoint: string;
    id: string;
    path: string;
    title: string;
}

export class ClientType {
    static JupyterLab = new ClientType("JupyterLab")
    static JupyterNotebook = new ClientType("JupyterNotebook")
    name: any;

    constructor(name) {
        this.name = name;
    }

    static fromString(name) {
        const hashMap = new Map(Object.entries(ClientType))
        if (!hashMap.has(name))
            throw new NotFoundError(`Not a valid enum name: ${name}`);
        return hashMap.get(name);
    }
}

export interface JupyterClientProps {
    base_url: string;
    jupyterBaseUrl: string;
    rootFolder: string;
    clientType: ClientType;
}

export class JupyterClient {
    base_url: any;
    jupyterBaseUrl: any;
    rootFolder: any;
    clientType: any;
    instance: axios.AxiosInstance;

    constructor({ base_url, jupyterBaseUrl, rootFolder, clientType }: JupyterClientProps) {
        this.base_url = base_url;
        this.rootFolder = rootFolder;
        this.jupyterBaseUrl = jupyterBaseUrl
        this.clientType = clientType
        this.instance = axios.create({
            baseURL: base_url
        })
    }

    getAbsolutePath(path: string): string {
        return trimWordEnd(this.rootFolder, '/') + '/' + trimWordStart(path, '/');
    }

    async createNote(path: string, noteTitle: string) {
        const uri = `/api/jupyter/create_notebook`;
        // Send a GET request (default method)
        let response;

        const payload = {
            path: this.getAbsolutePath(ensureSuffix(path, ".ipynb")),
            note_title: noteTitle,
            parents: true
        }
        log({ payload })
        response = await this.instance.post(uri,
            payload
        );
        console.log(response)
        return response;
    }

    async getNotes(): Promise<JupyterNote[]> {
        const uri = "/api/db/mysql/notes";
        // Send a GET request (default method)
        let response;
        response = await this.instance.get(uri);
        console.log(response)
        if (response.status == 200)
            return response.data.notes;
        else
            console.error("Can't get retrieve all notes");
        return []
    }

    getActualUrl(path: string): string {
        if (this.clientType === ClientType.JupyterLab) {
            return trimWordEnd(this.jupyterBaseUrl, '/')
                + '/lab/tree/'
                + trimWordStart(this.getAbsolutePath(path), '/')
        }
        else {
            return trimWordEnd(this.jupyterBaseUrl, '/')
                + '/'
                + trimWordStart(this.getAbsolutePath(path), '/')
        }
    }
}
