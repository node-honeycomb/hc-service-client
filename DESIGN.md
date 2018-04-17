## 设计思路

```
┌───────────────────────────────────────────────────────────┐
│ServiceClient                                              │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Extension                                             │ │
│ │ ┌──────────────┐   ┌──────────────┐  ┌──────────────┐ │ │
│ │ │ request otm  │   │ request azk  │  │ request asap │ │ │
│ │ │  extension   │   │  extension   │  │  extension   │ │ │
│ │ └──────────────┘   └──────────────┘  └──────────────┘ │ │
│ └───────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Signature                                             │ │
│ │ ┌─────────────────────────┐  ┌───────────┐  ┌─────┐   │ │
│ │ │signature one (default)  │  │raw request│  │ ... │   │ │
│ │ └─────────────────────────┘  └───────────┘  └─────┘   │ │
│ └───────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

## 概念定义

- Extension:  每个远端服务需要设置的特定需求，比如特定Header头等。
- Request:  发送请求的具体操作，过程中可以计算签名。

## 接口

### Extension 接口

```js
// 在honeybee应用中通过req.getService()使用serviceClient
@parameter request 在req.getService()的场景中，request是req
@parameter options Request中请求的参数,用于最后修改参数
@return newOptions 返回一个请求函数接收的新option
serviceClientExtension (request, options) {}

// 直接使用serviceClient发起请求
@parameter options Request中请求的参数,用于最后修改参数
@return newOptions 返回一个请求函数接收的新option
serviceClientExtension (options) {}
```

### Request 接口

##### signature(options)

### Usage

```js
// config.js
{
  extension: {
    serviceClient: {
      module: 'hc-service-client',
      config: {
        azk: {
          endpoint: 'xxx',
          token: 'xxx',
          signature: '',   // 内置 / 自定义方法
          beforeRequest: [func1, func2]    // 内置 / 自定义方法
        }
      }
    }
  }
}
```

```js
// use
const azkClient = req.getService('azk');
azkClient.get('/api/xxx', function (err, body) {
  // ...
}, opt);
```

