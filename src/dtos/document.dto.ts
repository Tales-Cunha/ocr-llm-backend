import { UserDTO } from './user.dto';
import { DocumentInteractionDTO } from './documentInteraction.dto';

export interface DocumentDTO {
    id: string;
    filename: string;
    originalUrl?: string;
    userId: string;
    user?: UserDTO;
    extractedText?: string;
    uploadedAt: Date;
    interactions?: DocumentInteractionDTO[];
  }