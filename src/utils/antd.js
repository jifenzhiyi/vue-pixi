import Vue from 'vue';
import {
  Button,
  Checkbox,
  ConfigProvider,
  Dropdown,
  Form,
  Icon,
  Input,
  message,
  Menu,
  Modal,
  Radio,
  Select,
  Spin,
  Switch,
} from 'ant-design-vue';

Vue.use(Button);
Vue.use(Checkbox);
Vue.use(ConfigProvider);
Vue.use(Dropdown);
Vue.use(Form);
Vue.use(Icon);
Vue.use(Input);
Vue.use(Menu);
Vue.use(Radio);
Vue.use(Select);
Vue.use(Spin);
Vue.use(Switch);

Vue.prototype.$message = message;
Vue.prototype.$modal = Modal;
