import { IMetadata, IEntity } from '../../../shared/kernel';

interface IFlagCategoryProps {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  depth: number;
  metadata: IMetadata;
}

export class FlagCategory implements IEntity<string> {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  depth: number;
  metadata: IMetadata;

  constructor(props: IFlagCategoryProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.parentId = props.parentId;
    this.depth = props.depth;
    this.metadata = props.metadata;
  }
}
