### ServiceClient
> hc-service-client

本项目支持两种用法，如下介绍为在honeybee extension中使用的方法。

直接使用ServiceClient请参考: [这里](./SERVICE_CLIENT.md) !!!

#### 在honeycomb extension中的例子

```js
{
  extension: {
    serviceClient: {
      module: 'hc-service-client',
      config: {
        otm: {
          endpoint: 'http://otm.com/v2',
          accessKeySecret: 'xxx',
          headerExtension: ['otm']
        },
        azk: {
          endpoint: 'http://algorithm.com/',
          accessKeySecret: 'xxx',
          workApp: 'test',
          headerExtension: ['azk']
        },
        brain: {
          endpoint: 'http://brain_domain.com/',
          accessKeySecret: 'xxx',
          headerExtension: [
            function (req, serviceCfg) {
              return {
                'X-Access-User': req.session.id
              };
            }
          ]
        }
      }
    }
  }
}
```

配置详情如下。

#### 配置

hc-service-client的配置结构:

```js
{
  [serviceCode]: {
    endpoint,
    accessKeyId,
    accessKeySecret,
    signatureApproach,
    headerExtension,
    disableFileSignature,
    headers,
    timeout
  }
}
```

| options              | desc                                     | default   |
| -------------------- | ---------------------------------------- | --------- |
| endpoint             | 远程的endpoint                              | 必填        |
| accessKeyId          | 调用的用户标志                                  | anonymous |
| accessKeySecret      | 调用的签名密钥，原token/systemToken               | 必填        |
| signatureApproach    | 签名方式  enum: [systemCall, userAuth]                                   | 默认 systemCall      |
| disableFileSignature | 禁用文件签名                                   | false     |
| headerExtension      | 根据环境动态修改header的扩展                        | []        |
| headers              | 使用serviceClient的默认发送headers，优先级高于headerExtension | {}        |
| timeout              | 请求的超时时间（单位ms）                            | 60000     |
| signatureHeader      | 签名请求头，默认 systemCall -> signature, userAuth -> Authorization | |

#### headerExtension

> 其他参数介绍见 [这里](./SERVICE_CLIENT.md)

headerExtension是一个数组，数组中元素支持动态扩展header，

支持

- 函数, function (req, serviceCfg) ，返回 header
- object，直接写header内容
- 内置扩展， 'otm' 、 'azk'

如:

```js
{
  otm: {
    endpoint: 'http://xxx',
    accessKeyId: 'DonaldTrump',
    accessKeySecret: config.systemToken,
    headerExtension: [
      function (req, serviceCfg) {
        return {
          'X-Access-TenantCode': req.session.tenant || serviceCfg.defaultTenant
        };
      },
      {
        'X-Access-WorkApp': 'city_brain'
      },
      'otm'
    ]
  }
}
```

如上配置，三个类型返回的header会merge到一起，再最终请求时带上。

#### 用法

```
const otm = req.getService('otm');
otm.get('/api/workspaces', {}, (err, data) => {});
```

```
const azk = req.getService('azk');
azk.get('/api/workspaces', {}, (err, data) => {});
```
