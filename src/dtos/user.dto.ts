import { DocumentDTO } from "./document.dto";
export type UserDTO = {
    id: string;
    email: string;
    name?: string;
    password: string;
    documents?: DocumentDTO[];
    createdAt: Date;
    updatedAt: Date;
}