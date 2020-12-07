import Vue from 'vue';
import {
  Button,
  ConfigProvider,
  Dropdown,
  Form,
  Icon,
  Input,
  message,
  Menu,
  Modal,
  Select,
} from 'ant-design-vue';

Vue.use(Button);
Vue.use(ConfigProvider);
Vue.use(Dropdown);
Vue.use(Form);
Vue.use(Icon);
Vue.use(Input);
Vue.use(Menu);
Vue.use(Select);

Vue.prototype.$message = message;
Vue.prototype.$modal = Modal;
