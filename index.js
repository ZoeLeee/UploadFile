const Koa = require('koa');
const app = new Koa();
const koaBody = require('koa-body');
const Router = require('koa-router');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
var os = require('os');

function getUploadUrl() {
  const ocType = os.type();
  if (ocType === "Windows_NT") {
    return path.join(__dirname, "/upload");
  }
  else
    return "/var/www/html/upload";
}


app.use(async (ctx, next) => {
  // 允许来自所有域名请求
  // ctx.set("Access-Control-Allow-Origin", "http://localhost:7778");
  // ctx.set("Access-Control-Allow-Origin", "http://localhost:7778");
  ctx.set('Access-Control-Allow-Origin', ctx.req.headers.origin)

  // 设置所允许的HTTP请求方法
  ctx.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");

  // 字段是必需的。它也是一个逗号分隔的字符串，表明服务器支持的所有头信息字段.
  ctx.set("Access-Control-Allow-Headers", "x-requested-with, accept, origin, Content-Type");

  // 服务器收到请求以后，检查了Origin、Access-Control-Request-Method和Access-Control-Request-Headers字段以后，确认允许跨源请求，就可以做出回应。

  // Content-Type表示具体请求中的媒体类型信息
  // ctx.set("Content-Type", "application/json;charset=utf-8,multipart/form-data");

  // 该字段可选。它的值是一个布尔值，表示是否允许发送Cookie。默认情况下，Cookie不包括在CORS请求之中。
  // 当设置成允许请求携带cookie时，需要保证"Access-Control-Allow-Origin"是服务器有的域名，而不能是"*";
  ctx.set("Access-Control-Allow-Credentials", true);

  // 该字段可选，用来指定本次预检请求的有效期，单位为秒。
  // 当请求方法是PUT或DELETE等特殊方法或者Content-Type字段的类型是application/json时，服务器会提前发送一次请求进行验证
  // 下面的的设置只本次验证的有效时间，即在该时间段内服务端可以不用进行验证
  ctx.set("Access-Control-Max-Age", 3000);

  /*
  CORS请求时，XMLHttpRequest对象的getResponseHeader()方法只能拿到6个基本字段：
      Cache-Control、
      Content-Language、
      Content-Type、
      Expires、
      Last-Modified、
      Pragma。
  */
  // 需要获取其他字段时，使用Access-Control-Expose-Headers，
  // getResponseHeader('myData')可以返回我们所需的值
  //https://www.rails365.net/articles/cors-jin-jie-expose-headers-wu
  // ctx.set("Access-Control-Expose-Headers", "myData");
  
  /* 解决OPTIONS请求 */
  if (ctx.method == 'OPTIONS') {
    ctx.body = '';
    ctx.status = 204;
  } else {
    await next();
  }
})

app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024	// 设置上传文件大小最大限制，默认2M
  }
}));

const router = new Router();

async function GetCode(url) {
  return new Promise((res, rej) => {
    QRCode.toDataURL(url, (err, url) => {
      if (!err) {
        res(url)
      }
      else
        rej(err);
    });
  })
}

router.post("/upload", async (ctx, next) => {
  console.log(4546);
  try {
    const file = ctx.request.files.files;	// 获取上传文件
    const reader = fs.createReadStream(file.path);	// 创建可读流
    const ext = file.name.split('.').pop();		// 获取上传文件扩展名
    let name = `${Math.random().toString()}.obj`
    let url = `${getUploadUrl()}/${name}`
    const upStream = fs.createWriteStream(path.join(__dirname, url));		// 创建可写流
    reader.pipe(upStream);	// 可读流通过管道写入可写流

    let code = await GetCode('http://www.dodream.wang/upload/' + name);

    ctx.body = {
      msg: "上传成功",
      code: 200,
      data: {
        fileUrl: `/upload/${name}`,
        code
      }
    };
  } catch (err) {
    console.log(err);
    ctx.body = {
      msg: "上传失败",
      code: 444,

    };
  }
});
router.post("/uploadImg", async (ctx, next) => {
  console.log(123);
  try {
    const file = ctx.request.files.files;	// 获取上传文件
    const reader = fs.createReadStream(file.path);	// 创建可读流
    const ext = file.name.split('.').pop();		// 获取上传文件扩展名
    let name = `${Date.now().toString()}.${ext}`
    let url = `${getUploadUrl()}/${name}`
    const upStream = fs.createWriteStream( url);		// 创建可写流
    reader.pipe(upStream);	// 可读流通过管道写入可写流

    ctx.body = {
      msg: "上传成功",
      code: 200,
      data: {
        url: `/upload/${name}`,
      }
    };
  } catch (err) {
    console.log(err);
    ctx.body = {
      msg: "上传失败",
      code: -1,
    };
  }
});

const AUTH_KEY = "joelee";

router.get("/cdnauth", async (ctx, next) => {
  try {
    if (ctx.query.key === AUTH_KEY)
      ctx.status = 200;
    else
      ctx.status = 401;
  } catch (err) {
    ctx.status = 401;
  }
});

app.use(router.routes());

app.listen(3600, () => {
  console.log("listening on 3600")
});
