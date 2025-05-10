import { IMetadata, IEntity } from '../../../shared/kernel';

export interface IGroupProps {
  id: string;
  name: string;
  description?: string;
  metadata: IMetadata;
}

export class Group implements IEntity<string> {
  id: string;
  name: string;
  description?: string;
  metadata: IMetadata;

  constructor(props: IGroupProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.metadata = props.metadata;
  }
}
