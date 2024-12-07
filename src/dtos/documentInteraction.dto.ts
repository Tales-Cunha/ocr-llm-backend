import { DocumentDTO } from "./document.dto";
export type DocumentInteractionDTO = {
    id: string;
    documentId: string;
    document?: DocumentDTO;
    userQuery: string;
    llmResponse: string;
    createdAt: Date;
}