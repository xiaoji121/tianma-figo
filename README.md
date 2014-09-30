tianma-figo
===========

自动替换figo配置的tianma中间件

## 使用方法

```javascript
tianma({ charset: 'gbk', port: 80 })
    .mount('/')
        .use('tianma-figo', '/Users/dongming/dev/github/tianma/fe.test.conf')
        .static()
```
