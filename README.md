# NOVA Authenticator Pro 网页版

NOVA 在浏览器本机生成 TOTP 验证码并保存加密保险库。它支持手动添加、相机识别 TOTP 二维码、登录凭据管理、密码生成和加密备份。保险库保存在浏览器当前站点的存储中。

## 在电脑上打开

安装 Node.js 后，在本目录运行 `node serve.cjs`，然后用浏览器打开 `http://127.0.0.1:4318/`。Windows 也可运行 `Start-NOVA.cmd`。使用同一个浏览器配置及同一个地址来访问同一份保险库。

## 部署和迁移

这是静态 PWA。将 `index.html`、`sw.js`、`manifest.webmanifest`、`icon.svg` 和 `vendor/` 放在同一 HTTPS 站点目录即可运行。若要保留现有网页保险库，请部署到原站点地址；换站点、端口、浏览器配置时，请用加密备份迁移。导入功能会在密码验证成功并经确认后替换当前站点的保险库。先在目标站点备份已有条目。

相机扫码所用的 jsQR 1.4.0 随网页一起提供，在浏览器内处理画面。许可证见 `vendor/jsQR-LICENSE`。首次加载后，支持 Service Worker 的浏览器可离线使用。

运行 `node tests/vault-check.cjs` 检查兼容性和保险库操作。
