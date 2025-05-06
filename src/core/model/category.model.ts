import { IEntity, Metadata } from '../../shared/kernel';

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  parentId?: string;
  createdBy: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  parentId?: string;
  updatedBy: string;
  depth?: number;
}

export class FlagCategory implements IEntity<string> {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  depth: number;
  metadata: Metadata;

  constructor(data: {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    depth: number;
    metadata: Metadata;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.parentId = data.parentId;
    this.depth = data.depth;
    this.metadata = data.metadata;
  }
}
