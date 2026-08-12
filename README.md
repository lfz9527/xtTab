```
root/                           # 项目根目录
├── public                      # 不需要处理的静态资源文件
├── src/                        # 代码根目录
│   ├── assets/                 # 需要处理的资源文件夹
│   ├── components/             # 默认自动导入，包含UI组件
│   ├── entries/                # 包含插件入口
│   ├── hooks/                  # 默认自动导入，包含项目钩子的源代码，用于 React
│   ├── utils/                  # 默认自动导入，包含通用工具
│   ├── constants/              # 常量
│   ├── services/               # 接口服务
│   └── types/                  # 类型
├── .env                        # 全局环境变量
├── .env.development            # 发布用的全局变量
├── .env.production             # 发布用的全局变量
└── README.md                   # 项目说明文档

```
