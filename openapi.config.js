import { generateService } from '@umijs/openapi'

generateService({
  requestLibPath: "import { request } from '../fetchService'",
  schemaPath: 'http://192.168.31.146:8003/swagger/v1/swagger.json', // 可以是.json文件，也可以是远程json地址
  serversPath: './src/services'
})
