## class ServiceClient

ServiceCilent 支持本身被单独使用:

调用方式

```js
import { ServiceClient } from 'hc-service-client';
const client = new ServiceClient(options);

// 以get方法举例，其它方法的调用与get方法一致
client.get('/xxx')              // return promise
client.get('/xxx', callback)    // return undefined
client.get('/xxx', {data})      // return promise
client.get('/xxx', {data}, callback)      // return undefined
client.get('/xxx', {data}, timeout)       // return promise
client.get('/xxx', {data}, timeout, callback)   // return undefined
client.get('/xxx', {data}, {urllibOptions})     // return promise
client.get('/xxx', {data}, {urllibOptions}, callback) // return undefined
```

参数信息：

| options              | desc                              | default     |
| -------------------- | --------------------------------- | ----------- |
| endpoint             | 远程的endpoint                       | 必填          |
| accessKeyId          | 调用的用户标志                           | anonymous    |
| accessKeySecret      | 调用的签名密钥                           | 必填          |
| signatureApproach    | 签名方式  enum: [systemCall, userAuth]                                   | 默认 systemCall      |
| log                  | log模块，里面提供debug/info/error/warn方法 | console.log |
| disableFileSignature | 禁用文件签名                            | false       |
| headers              | 使用serviceClient的默认发送headers       | {}          |
| timeout              | 请求的超时时间（单位ms）                     | 60000       |
| signatureHeader      | 签名请求头，默认 systemCall -> signature, userAuth -> Authorization | |
| responseWrapper      | 为true时接口返回的结果会被要求 data.code === 'SUCCESS' | true |

systemCall 例子:

```js
import { ServiceClient } from 'hc-service-client';
const otmClient = new ServiceClient({
  endpoint: 'http://10.218.141.22',
  accessKeySecret: 'xxx',
  headers: {
    'x-access-tenantcode': 'dtboost',
    'x-access-workspaceid': '1'
  }
});

otmClient.post('/api/v2/objects', {}, function (err, data) {
  // do something.
});
otmClient.get('/api/v2/objects').then(d => {
  // do something.
});
```

userAuth 例子:

```js
import { ServiceClient } from 'hc-service-client';
const userClient = new ServiceClient({
  endpoint: 'http://dtboost-inner.shuju.aliyun.com',
  signatureApproach: 'userAuth',
  accessKeyId: 'aaa',
  accessKeySecret: 'bbb'
});

userClient.post('/analysis/api/query', {}, function (err, data) {
  // do something.
});
```
