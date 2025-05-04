import { IEntity } from '@shared/kernel/base.interfaces';
import { Metadata } from '@shared/kernel/base.types';

export class FlagCategory implements IEntity<string> {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  depth: number; // Глубина вложенности (0 - корневая категория, 1, 2, максимум 3)
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

// DTO для создания категории
export interface CreateCategoryDTO {
  name: string;
  description?: string;
  parentId?: string;
  createdBy: string;
}

// DTO для обновления категории
export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  parentId?: string;
  updatedBy: string;
  depth?: number;
}
