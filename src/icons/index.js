// 自动化加载svg目录下所有svg文件
// 使用webpack提供require.context()指定svg为固定上下文
const req = require.context('./svg', false, /\.svg$/);

// keys() 返回的上下文中的所有文件名
req.keys().map(req);
