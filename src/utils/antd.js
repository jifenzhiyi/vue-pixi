import Vue from 'vue';
import {
  Button,
  ConfigProvider,
  Form,
  Icon,
  Input,
  message,
  Modal,
} from 'ant-design-vue';

Vue.use(Button);
Vue.use(ConfigProvider);
Vue.use(Form);
Vue.use(Icon);
Vue.use(Input);

Vue.prototype.$message = message;
Vue.prototype.$modal = Modal;
