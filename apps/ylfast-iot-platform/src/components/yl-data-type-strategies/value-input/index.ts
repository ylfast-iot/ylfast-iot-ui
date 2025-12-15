import ArrayInput from './ArrayInput.vue';
import BooleanInput from './BooleanInput.vue';
import DateInput from './DateInput.vue';
import EnumSelect from './EnumSelect.vue';
import FileInput from './FileInput.vue';
import GeoInput from './GeoInput.vue';
import NumberInput from './NumberInput.vue';
import ObjectInput from './ObjectInput.vue';
import { getFormItemComponent, registerFormItemComponent } from './registry';
import StringInput from './StringInput.vue';

// Register defaults
registerFormItemComponent('STRING', StringInput);
registerFormItemComponent('PASSWORD', StringInput);

registerFormItemComponent('INTEGER', NumberInput);
registerFormItemComponent('LONG', NumberInput);
registerFormItemComponent('SHORT', NumberInput);
registerFormItemComponent('FLOAT', NumberInput);
registerFormItemComponent('DOUBLE', NumberInput);

registerFormItemComponent('BOOLEAN', BooleanInput);

registerFormItemComponent('DATE', DateInput);

registerFormItemComponent('ENUM', EnumSelect);

registerFormItemComponent('OBJECT', ObjectInput);

registerFormItemComponent('ARRAY', ArrayInput);

registerFormItemComponent('FILE', FileInput);
registerFormItemComponent('GEO', GeoInput);

export { getFormItemComponent, registerFormItemComponent };
