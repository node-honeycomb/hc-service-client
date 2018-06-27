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
| responseWrapper      | 处理返回结果的function | 默认函数，返回结果result.code!== 'SUCCESS'时作为错误处理，否则将result.data作为结果返回，详见下面文档responseWrapper参数介绍 |

### responseWrapper
> responseWrapper是一个function，用于处理返回结果

responseWrapper返回结果及效果

- 每次调用远程接口并且无发生调用错误时，会调用responseWrapper函数传入接口返回结果，并根据responseWrapper的返回决定是否作为错误返回给调用层；
- 函数返回 Error 对象时，后续处理认为此次请求失败，并作为失败处理；
- 函数返回正常 Object 时，后续处理认为此次请求成功，并将结果返回给调用层；

### 默认responseWrapper函数

```js
function (data) {
  // stream 模式时，data为空
  if (!data) {
    return data;
  }

  if (data.code !== 'SUCCESS') {
    const err = new Error(data.message || 'empty error message');
    Object.assign(err, data);
    return err;
  }

  return data.data;
}
```

### 使用responseWrapper的场景及例子

场景：
对接新系统，返回的数据结构为 result.errCode === 0 时表示成功，结果存放在result.data，其他时候表示失败，失败的信息存放在 result.errMsg.

配置responseWrapper:

```js
new ServiceClient({
  responseWrapper: function (data) {
    if (!data) {
      return data;
    }

    if (data.errCode !== 0) {
      const err = new Error(data.errMsg || 'empty error message');
      err.code = err.errCode;
      return err;
    }

    return data.data;
  }
}).get('/xxx', function(err, data) {
  // err: http请求error或者responseWrapper返回的error对象.
  // data: responseWrapper返回的正常对象
});
```

特别的，如果不想对结果做任何处理则可以使用如下responseWrapper:

```js
function (data) {
  return data;
}
```

### examples

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
