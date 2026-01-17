import ArrayDefinition from './ArrayDefinition.vue';
import BooleanDefinition from './BooleanDefinition.vue';
import DateDefinition from './DateDefinition.vue';
import EnumDefinition from './EnumDefinition.vue';
import FileDefinition from './FileDefinition.vue';
import GeoDefinition from './GeoDefinition.vue';
import NumberDefinition from './NumberDefinition.vue';
import ObjectDefinition from './ObjectDefinition.vue';
import PasswordDefinition from './PasswordDefinition.vue';
import {
  getTypeDefinitionComponent,
  registerTypeDefinitionComponent,
} from './registry';
import StringDefinition from './StringDefinition.vue';

// Register defaults
registerTypeDefinitionComponent('FLOAT', NumberDefinition);
registerTypeDefinitionComponent('DOUBLE', NumberDefinition);
registerTypeDefinitionComponent('INTEGER', NumberDefinition);
registerTypeDefinitionComponent('LONG', NumberDefinition);
registerTypeDefinitionComponent('SHORT', NumberDefinition);

registerTypeDefinitionComponent('STRING', StringDefinition);
registerTypeDefinitionComponent('PASSWORD', StringDefinition);

registerTypeDefinitionComponent('BOOLEAN', BooleanDefinition);

registerTypeDefinitionComponent('DATE', DateDefinition);

registerTypeDefinitionComponent('ENUM', EnumDefinition);

registerTypeDefinitionComponent('OBJECT', ObjectDefinition);
registerTypeDefinitionComponent('PASSWORD', PasswordDefinition);
registerTypeDefinitionComponent('STRING', StringDefinition);

registerTypeDefinitionComponent('ARRAY', ArrayDefinition);
registerTypeDefinitionComponent('FILE', FileDefinition);
registerTypeDefinitionComponent('GEO', GeoDefinition);

export { getTypeDefinitionComponent, registerTypeDefinitionComponent };
