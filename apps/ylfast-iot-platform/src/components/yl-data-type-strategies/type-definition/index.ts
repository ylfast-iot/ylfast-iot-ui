import EnumDefinition from './EnumDefinition.vue';
import FloatDefinition from './FloatDefinition.vue';
import {
  getTypeDefinitionComponent,
  registerTypeDefinitionComponent,
} from './registry';

// Register defaults
registerTypeDefinitionComponent('FLOAT', FloatDefinition);
registerTypeDefinitionComponent('DOUBLE', FloatDefinition);

registerTypeDefinitionComponent('ENUM', EnumDefinition);

export { getTypeDefinitionComponent, registerTypeDefinitionComponent };
