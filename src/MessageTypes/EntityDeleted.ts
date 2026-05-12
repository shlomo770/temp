export interface EntityDeletedData {
  entityId: string;
}

export interface EntityDeletedMessage {
  header: {
    name: 'ENTITY_DELETED';
  };
  data: EntityDeletedData;
} 